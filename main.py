import requests
import os
import time
from bs4 import BeautifulSoup

def clear_screen():
    """Clears the console screen."""    
    # For Windows
    if os.name == 'nt':
        os.system('cls')
    # For macOS and Linux (os.name is 'posix')
    else:
        os.system('clear')

def select_region():
    """Displays a menu of regions and returns the chosen URL parameter and name."""
    regions = {
        "1": {"name": "Alle Regio's", "param": ""},
        "2": {"name": "KNRM", "param": "rb=1"},
        "3": {"name": "Lifeliners", "param": "ll=1"},
        "4": {"name": "Groningen", "param": "groningen=1"},
        "5": {"name": "Friesland", "param": "friesland=1"},
        "6": {"name": "Drenthe", "param": "drenthe=1"},
        "7": {"name": "IJsselland", "param": "ijsselland=1"},
        "8": {"name": "Twente", "param": "twente=1"},
        "9": {"name": "Noord- en Oost Gelderland", "param": "nogland=1"},
        "10": {"name": "Gelderland-Midden", "param": "glandmidden=1"},
        "11": {"name": "Gelderland-Zuid", "param": "glandzuid=1"},
        "12": {"name": "Utrecht", "param": "utrecht=1"},
        "13": {"name": "Noord-Holland Noord", "param": "nholn=1"},
        "14": {"name": "Zaanstreek-Waterland", "param": "zwland=1"},
        "15": {"name": "Kennemerland", "param": "kennemerland=1"},
        "16": {"name": "Amsterdam-Amstelland", "param": "adamal=1"},
        "17": {"name": "Gooi en Vechtstreek", "param": "gooienvechtstr=1"},
        "18": {"name": "Haaglanden", "param": "haagl=1"},
        "19": {"name": "Hollands Midden", "param": "holmid=1"},
        "20": {"name": "Rotterdam-Rijnmond", "param": "rdamrm=1"},
        "21": {"name": "Zuid-Holland Zuid", "param": "zhz=1"},
        "22": {"name": "Zeeland", "param": "zeeland=1"},
        "23": {"name": "Midden- en West Brabant", "param": "mewbranant=1"},
        "24": {"name": "Brabant Noord", "param": "brabantn=1"},
        "25": {"name": "Brabant Zuid-Oost", "param": "brabantzo=1"},
        "26": {"name": "Limburg Noord", "param": "limburgn=1"},
        "27": {"name": "Limburg Zuid", "param": "limburgz=1"},
        "28": {"name": "Flevoland", "param": "flevol=1"},
    }
    
    print("--- Select a Region ---")
    for key, value in regions.items():
        print(f"{key:>2}. {value['name']}")
        
    while True:
        try:
            choice = input(f"Enter a number (1-{len(regions)}): ")
            if choice in regions:
                return regions[choice]['param'], regions[choice]['name']
            else:
                print("Invalid choice, please try again.")
        except (ValueError, KeyError):
            print("Invalid input. Please enter a number.")
        
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

        if not unique_alerts:
            return None # Return None if no alerts are found
        else:
            return unique_alerts[0] # Return the latest alert data

    except requests.exceptions.RequestException as e:
        print(f"\nAn error occurred while trying to fetch the website: {e}")
        return None

def main():
    """Main function to select a region and enter the automatic refresh loop."""
    clear_screen()
    region_param, region_name = select_region()
    base_url = 'http://www.p2000-online.net/p2000.py'
    url = f"{base_url}?{region_param}" if region_param else base_url
    
    last_alert_identifier = None

    try:
        while True:
            clear_screen()
            
            latest_alert = scrape(url)

            if latest_alert:
                current_alert_identifier = (latest_alert['datetime'], latest_alert['message'])
                
                if current_alert_identifier != last_alert_identifier:
                    print("--- New Alert ---")
                    last_alert_identifier = current_alert_identifier
                    new_alert = 1
                else:
                    print("--- No New Alert ---")
                    new_alert = 0

                print(f"Time:    {latest_alert['datetime']}")
                print(f"Service: {latest_alert['service']}")
                print(f"Region:  {latest_alert['region']}")
                print(f"Message: {latest_alert['message']}")
                print("--------------------")
            else:
                print("No alerts found for this region.")

            time.sleep(10)
    except KeyboardInterrupt:
        raise KeyboardInterrupt("Script stopped by user. Exiting.")

if __name__ == "__main__":
    main()