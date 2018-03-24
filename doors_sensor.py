import time
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)

door_pin = 4

GPIO.setup(door_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
 
while True:
    if GPIO.input(door_pin) == 1:
	print("DOOR OPEN!")
    elif GPIO.input(door_pin) == 0:
	print("DOOR CLOSED!")
    time.sleep(0.5)
