import json
import RPi.GPIO as GPIO
from time import sleep
from losantmqtt import Device # Import Losant library: https://github.com/Losant/losant-mqtt-python

# We need to describe what GPIO is available to control.
# This key is the GPIO number and the value is the peripheral to control.
availableGPIO = {"17": GPIO(17)}

# Construct Losant device
device = Device("Pi_3", "d7ff9bec-fd52-41f0-ac8f-1337e657b9c7", "01d41ec9fd8f5e6b69bd77b53f7de0c4d9afa1d829f95ec455af6e269567a0cb")

def on_command(device, command):
    print(command["name"] + " command received.")

    # Listen for the gpioControl. This name configured in Losant
    if command["name"] == "gpioControl":
        # The gpio that's passed in from the path parameter
        currentGpio = int(command["payload"]["gpio"])
        currentGpioText = str(currentGpio)

        # Get the lock at that physical GPIO number
        # from our availableGPIO
        lock = availableGPIO.get(currentGpioText)

        # If found, activate the lock
        # If not, display a message
        if lock:
            print("Powering the LOCK" + str(currentGpioText))
            lock.toggle()
        else:
            print("GPIO not configured " + str(currentGpioText))



# Listen for commands.
device.add_event_observer("command", on_command)

print("Listening for device commands")

# Connect to Losant and leave the connection open
device.connect(blocking=True)