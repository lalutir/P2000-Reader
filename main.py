import requests
import os
import time
from bs4 import BeautifulSoup

def send_notification(alert, ntfy_topic):
    """Sends a notification using ntfy."""
    if not ntfy_topic:
        print("NTFY_TOPIC environment variable not set. Skipping notification.")
        return
        
    try:
        requests.post(
            f"https://ntfy.sh/{ntfy_topic}",
            data=alert['message'].encode('utf-8'),
            headers={
                "Title": f"New Alert: {alert['service']}",
                "Priority": "high",
                "Tags": "police_car" if alert['service'] == "Politie" else "fire_engine" if alert['service'] == "Brandweer" else "ambulance"
            })
        print("--> Notification sent!")
    except Exception as e:
        print(f"--> Failed to send notification: {e}")

def clear_screen():
    """Clears the console screen."""    
    if os.name == 'nt':
        os.system('cls')
    else:
        os.system('clear')

def scrape(url):
    """Scrapes and returns the single latest alert from the given URL."""
    try:
        response = requests.get(url)
        response.raise_for_status()
        response.encoding = 'windows-1252'
        soup = BeautifulSoup(response.text, 'html.parser')

        all_alerts_raw = []
        main_alert_rows = soup.find_all(lambda tag: tag.name == 'tr' and tag.find('td', class_='DT'))

        for row in main_alert_rows:
            dt_cell = row.find('td', class_='DT')
            service_cell = row.find('td', class_=['Am', 'Br', 'Po'])
            region_cell = row.find('td', class_='Regio')
            message_cell = row.find('td', class_=['Md', 'Mdx'])

            if dt_cell and service_cell and region_cell and message_cell:
                all_alerts_raw.append({
                    "datetime": dt_cell.text.strip(),
                    "service": service_cell.text.strip(),
                    "region": region_cell.text.strip(),
                    "message": message_cell.text.strip(),
                })

        unique_alerts = []
        seen_alerts = set()
        for alert in all_alerts_raw:
            identifier = (alert['datetime'], alert['message'])
            if identifier not in seen_alerts:
                unique_alerts.append(alert)
                seen_alerts.add(identifier)

        return unique_alerts[0] if unique_alerts else None

    except requests.exceptions.RequestException as e:
        print(f"\nAn error occurred while trying to fetch the website: {e}")
        return None

def main():
    """Main function to select a region and enter the automatic refresh loop."""
    clear_screen()

    ntfy_topic = os.environ.get('NTFY_TOPIC')
        
    base_url = 'http://www.p2000-online.net/p2000.py'
    url = f"{base_url}" 
    
    if ntfy_topic:
        print(f"--- Notifications will be sent to ntfy.sh/{ntfy_topic} ---")
    else:
        print("--- Notifications are disabled (NTFY_TOPIC not set) ---")

    last_alert_identifier = None

    while True:
        latest_alert = scrape(url)

        if latest_alert:
            current_alert_identifier = (latest_alert['datetime'], latest_alert['message'])
            
            if current_alert_identifier != last_alert_identifier:
                clear_screen()
                print(f"--- New Alert ---")
                last_alert_identifier = current_alert_identifier
                
                print(f"Time:    {latest_alert['datetime']}")
                print(f"Service: {latest_alert['service']}")
                print(f"Region:  {latest_alert['region']}")
                print(f"Message: {latest_alert['message']}")
                print("--------------------")
                
                if "ZOETMR" in latest_alert['service'].upper():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "ZOETMR" in latest_alert['message'].upper():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "zoetermeer" in latest_alert['service'].lower():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "zoetermeer" in latest_alert['message'].lower():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "BLEISW" in latest_alert['service'].upper():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "BLEISW" in latest_alert['message'].upper():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "bleiswijk" in latest_alert['service'].lower():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "bleiswijk" in latest_alert['message'].lower():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "DELFT" in latest_alert['message'].upper():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                elif "delft" in latest_alert['message'].lower():
                    print("--> Service matches any of locations, attempting to send notification...")
                    send_notification(latest_alert, ntfy_topic)
                else:
                    print("--> Service does not match locations, skipping notification.")
        
        time.sleep(1)

if __name__ == "__main__":
    main()