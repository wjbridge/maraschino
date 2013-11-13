import psutil

from flask import Flask, render_template 

from maraschino import app, logger
from maraschino.tools import requires_auth, format_number, get_setting_value
from maraschino.database import db_session


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