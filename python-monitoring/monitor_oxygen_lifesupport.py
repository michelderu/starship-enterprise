# Import os level funtions for current directory and environment variables
import os
# Import time functions
import time
from datetime import datetime, timedelta
# Import scheduler/crontab
import schedule
# Import Cassandra driver
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
# Import smtplib for the actual sending function
import smtplib
# Import the email modules we'll need
from email.message import EmailMessage

# Connect to the Astra database
def connectAstra():
    cloud_config = {
        'secure_connect_bundle': os.getcwd() + '/' + os.getenv('ASTRA_SECURE_CONNECT_BUNDLE')
    }
    auth_provider = PlainTextAuthProvider(username=os.getenv('ASTRA_DB_USERNAME'), password=os.getenv('ASTRA_DB_PASSWORD'))
    cluster = Cluster(cloud=cloud_config, auth_provider=auth_provider)
    return cluster.connect()

# Get the time range for every rolling window of a minute
def checkOxygenLevels():
    time = datetime.now()
    yyyymmddhhmm = time.strftime("%Y%m%d%H%M")
    print ("Checking oxygen levels in the rolling minute window", yyyymmddhhmm)

    rows = session.execute("\
        SELECT reading FROM life_support_systems.sensor_data \
        WHERE yyyymmddhhmm = '" + yyyymmddhhmm + "' AND ship = 'Starship Astra' and sensor = 'oxygen' \
        LIMIT 1; \
    ")

    if rows.one():
        oxygen = rows.one().reading
        if oxygen < 18:
            print ("Alert! Oxygen value", oxygen, "below threshold of 18 ppm. Immediate action required!")
            #sendAlert(yyyymmddhhmm, oxygen)
        else:
            print ("Oxygen levels normal at a minimum of", oxygen)
    else:
        print ("No data available!")

# Send a message using SMTP
def sendAlert(yyyymmddhhmm, oxygen):
    msg = EmailMessage()
    msg.set_content("Alert! Oxygen value " + str(oxygen) + " below threshold of 18 during rolling one minute window of " + yyyymmddhhmm)

    # me == the sender's email address
    # you == the recipient's email address
    msg['Subject'] = "Alert! Oxygen low!"
    msg['From'] = "test"
    msg['To'] = "michel@de-ru.net"

    # Send the message via our own SMTP server.
    s = smtplib.SMTP('localhost')
    s.send_message(msg)
    s.quit()
    
# Connect to Astra
session = connectAstra()

# Task scheduling 
schedule.every(5).seconds.do(checkOxygenLevels) 

# Loop so that the scheduling task 
# keeps on running all time. 
while True: 
  
    # Checks whether a scheduled task  
    # is pending to run or not 
    schedule.run_pending() 
    time.sleep(1)