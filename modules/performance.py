import psutil
import sys
import itertools

from flask import Flask, render_template 
from collections import namedtuple

from maraschino import app, logger
from maraschino.tools import requires_auth, format_number, get_setting_value


@app.route('/xhr/performance/')
@requires_auth
def xhr_performance():
    
    info = {}
    settings = {}
    
    physicalMemory = psutil.virtual_memory()
    swapMemory = psutil.swap_memory()
    netio = psutil.net_io_counters(False)
      
    #Get settings
    settings['show_cpu_utilization'] = get_setting_value('show_cpu_utilization')
    settings['show_network_utilization'] = get_setting_value('show_network_utilization')
    settings['show_process_utilization'] = get_setting_value('show_process_utilization')
    
    info['usedPhyMemory'] = bytes2human(physicalMemory.used)
    info['availPhyMemory'] = bytes2human(physicalMemory.free)
    info['totalPhyMemory'] = bytes2human(physicalMemory.total)
    
    info['usedSwapMemory'] = bytes2human(swapMemory.used)
    info['availSwapMemory'] = bytes2human(swapMemory.free)
    info['totalSwapMemory'] = bytes2human(swapMemory.total)
    
    info['bytesSent'] = netio.bytes_sent
    info['bytesRecv'] = bytes2human(netio.bytes_recv)
    info['packetSent'] = bytes2human(netio.packets_sent)
    info['packetRecv'] = bytes2human(netio.packets_recv)
    info['errin'] = netio.errin
    info['errout'] = netio.errout
    
    # must have some delay to prevent errors
    info['cpuPercent'] = psutil.cpu_percent(0.1, True) 
    info['cpuOverall'] = psutil.cpu_percent(0.1, False)
    info['cpuTimes'] = psutil.cpu_times_percent(0.1, False)
    
    info['processPerformance'] = get_process_performance()
    logger.log(get_setting_value('show_process_utilization'), 'INFO')
        
    return render_template('performance.html', result = info, settings = settings) # Render the template for our module

@app.route('/xhr/performance/bytes2human/<number>')
@requires_auth
def bytes2human(n):
    # http://code.activestate.com/recipes/578019
    # >>> bytes2human(10000)
    # '9.8K'
    # >>> bytes2human(100001221)
    # '95.4M'
    symbols = ('K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y')
    prefix = {}
    for i, s in enumerate(symbols):
        prefix[s] = 1 << (i+1)*10
    for s in reversed(symbols):
        if n >= prefix[s]:
            value = float(n) / prefix[s]
            return '%.3f%s' % (value, s)
    return "%sB" % n

@app.route('/xhr/performance/get_process_performance/')
@requires_auth
def get_process_performance():
    ACCESS_DENIED = ''
    processList = [ ]
    
    for pid in psutil.get_pid_list():
        if (psutil.pid_exists(pid)):
            try:
                p = psutil.Process(pid)
                pinfo = p.as_dict(ad_value=ACCESS_DENIED)
            except psutil.NoSuchProcess:
                logger.error(str(sys.exc_info()[1]))
            
            Process = namedtuple('Process', "pid name cpu_percent memory_percent")
            
            if (pinfo['name']):
                processList.append(Process(pid=pinfo['pid'], name=pinfo['name'], cpu_percent=round(pinfo['cpu_percent'], 3), memory_percent=round(pinfo['memory_percent'], 2)))
    
    processList = sorted(processList, key=lambda x: x.memory_percent, reverse=True)
    
    return processList