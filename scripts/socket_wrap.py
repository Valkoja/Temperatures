# !/usr/bin/python3
# -*- coding: utf-8 -*-

import sys
import socketio

class SocketWrap:
    def __init__(self, aLogger):
        self.io = socketio.Client(reconnection_attempts=5, reconnection_delay=1, reconnection_delay_max=1, logger=aLogger)

        self.io.on('connect', self.sendMessage, namespace='/scripts')
        self.io.on('confirm', self.closeSocket, namespace='/scripts')

    def send(self, aMessage, aData=None):
        self.data = aData
        self.message = aMessage

        self.io.connect('http://localhost:80', namespaces=['/scripts'])
        self.io.wait()

    def sendMessage(self):
        self.io.emit(self.message, self.data, namespace='/scripts')

    def closeSocket(self):
        self.io.sleep(1)
        self.io.disconnect()