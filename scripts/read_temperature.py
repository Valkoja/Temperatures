# !/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import time
import logging
import threading

from socket_wrap import SocketWrap

logging.basicConfig(filename='/var/log/temperature_errors.log', level=logging.ERROR, format='%(asctime)s - %(message)s', datefmt='%Y.%m.%d %H:%M:%S')

def readTemperature(aList, aID):
    try:
        handle = open('/sys/bus/w1/devices/{}/w1_slave'.format(aID))
        output = handle.read()

        parts = output.split(' ')
        value = float(parts[-1][2:].rstrip()) / 1000

        if 0 <= value <= 80:
            aList.append(value)

    except:
        pass

    finally:
        handle.close()

try:
    values = []
    threads = []
    sensorID = sys.argv[1]

    for i in range(6):
        threads.append(threading.Thread(target=readTemperature, args=(values, sensorID)))
        threads[-1].start()

        if i < 5:
            time.sleep(10)

    for t in threads:
        t.join()

    if len(values) > 0:
        socketObj = SocketWrap(logging.getLogger(__name__))
        socketObj.send('New temperature', '["{}",{}]'.format(sensorID, round(sum(values) / len(values), 1)))

    else:
        raise Exception('Mittarilta {} ei saatu luettua arvoja tai ne kaikki olivat rajojen ulkopuolella'.format(sensorID))

except IndexError:
    logging.error('Mittarin ID:tä ei ole annettu')

except Exception as err:
    logging.error(err)