import psutil
import re
import itertools
        
from flask import Flask, render_template 
from collections import namedtuple

from maraschino import app, logger, SCHEDULE
from maraschino.tools import requires_auth, get_setting_value, convert_bytes
from maraschino.modules import get_module

lastBytesReceived = 0
lastBytesSent = 0
processList = [ ]
processSchedule = None

@app.route('/xhr/performance/')
@requires_auth
def xhr_performance():
    global processSchedule
    global processList
    
    info = {}
    settings = {}
    
    if (processSchedule == None):
        logger.log("Process List SCHEDULE Job is Starting", 'INFO')
        SCHEDULE.add_interval_job(get_process_performance, seconds=5)
        processSchedule = 1
    
    #Get Memory Status and NetIO Status
    physicalMemory = psutil.virtual_memory()
    swapMemory = psutil.swap_memory()
    netio = psutil.net_io_counters(False)
    
    #Get settings
    settings['show_cpu_utilization'] = get_setting_value('show_cpu_utilization')
    settings['show_network_utilization'] = get_setting_value('show_network_utilization')
    settings['show_process_utilization'] = get_setting_value('show_process_utilization')
    
    #Get Memory Stats
    info['usedPhyMemory'] = convert_bytes(physicalMemory.used)
    info['availPhyMemory'] = convert_bytes(physicalMemory.free)
    info['totalPhyMemory'] = convert_bytes(physicalMemory.total)
    info['usedSwapMemory'] = convert_bytes(swapMemory.used)
    info['availSwapMemory'] = convert_bytes(swapMemory.free)
    info['totalSwapMemory'] = convert_bytes(swapMemory.total)
    
    #Display Network Status
    if (settings['show_network_utilization'] == '1'):
        info['bytesSent'] = convert_bytes(netio.bytes_sent)
        info['bytesSentRate'] = updateSentRate(netio.bytes_sent)
        info['bytesRecv'] = convert_bytes(netio.bytes_recv)
        info['bytesRecvRate'] = updateDownloadRate(netio.bytes_recv)
        info['packetSent'] = convert_bytes(netio.packets_sent).replace('B', '')
        info['packetRecv'] = convert_bytes(netio.packets_recv).replace('B', '')
        info['errin'] = netio.errin
        info['errout'] = netio.errout
    
    # must have some delay to prevent errors
    if (settings['show_cpu_utilization'] == '1'):
        i = 0
        cpuList = [ ]
        cpuPerCore = namedtuple('CPUPerCore', "index CPUpercentage")
        for item in psutil.cpu_percent(0.1, True):
            cpuList.append(cpuPerCore(index=i, CPUpercentage=item))
            i += 1
        info['totalCPUCol'] = i     #used for html format table
        info['cpuPercent'] = cpuList
        info['cpuOverall'] = psutil.cpu_percent(0.1, False)
        info['cpuTimes'] = psutil.cpu_times_percent(0.1, False)
    
    if (settings['show_process_utilization'] == '1'):
        info['processPerformance'] = processList
    
    # Render the template for our module
    return render_template('performance.html', result = info, settings = settings)

def get_process_performance():
    ''' Gets the list of processes that are using the most CPU and RAM on the system '''
    global processList
    global enableThread
       
    #Create anmed tuple to store list
    Process = namedtuple('Process', "pid name cpu_percent memory_percent")
      
    Plist = [ ]

    #Create a list of all processes with info about them
    for pid in psutil.process_iter():
        try:
            #Do we have a process that has 'python'
            if ('python' in pid.name.lower()):
                #get python script name
                Plist.append(Process(pid=pid.pid, name=extractPythonScriptName(pid), cpu_percent=round(pid.get_cpu_percent(), 3), memory_percent=round(pid.get_memory_percent(), 2)))
            else:
                #Use generic name
                Plist.append(Process(pid=pid.pid, name=pid.name, cpu_percent=round(pid.get_cpu_percent(), 3), memory_percent=round(pid.get_memory_percent(), 2)))
        
        except psutil.AccessDenied:
            pass
    
    #Sort the list first by CPU then by Memory. Get top x
    Plist = sorted(Plist, key=lambda x: (x.cpu_percent, x.memory_percent), reverse=True)
    
    #Assign list
    processList = Plist[:int(get_setting_value('top_process_number'))]
    
def extractPythonScriptName(pid):
    ''' Extracts the python script name instead of just showing process name as 'python' '''
    
    #Combine all command line arguments
    cmdStr = ''.join(pid.cmdline)
    
    #Search for python script name
    match = re.search(r'\w+\.py', cmdStr)
    
    #Found match?
    if match:
        return match.group()
    else:
        return pid.name

def updateDownloadRate(newRateRecv):
    ''' Updates the Download Rate '''
    global lastBytesReceived
        
    #Get module poll rate. Will be used to calculate MB/Sec
    pollRate = get_module('performance').poll
    
    diff = newRateRecv - lastBytesReceived
    
    lastBytesReceived = newRateRecv
    
    return convert_bytes(round(diff / pollRate, 1))

def updateSentRate(newRateSent):
    '''Updates the Send Rate '''
    global lastBytesSent
    
    #Get module poll rate. Will be used to calculate MB/Sec
    pollRate = get_module('performance').poll
    
    diff = newRateSent - lastBytesSent
    
    lastBytesSent = newRateSent
    
    return convert_bytes(round(diff / pollRate, 1))