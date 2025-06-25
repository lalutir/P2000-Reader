import requests

def send_notification(message, ntfy_topic):
    """Sends a notification using ntfy."""
    if not ntfy_topic:
        print("NTFY_TOPIC environment variable not set. Skipping notification.")
        return
        
    try:
        requests.post(
            f"https://ntfy.sh/{ntfy_topic}",
            data=message.encode('utf-8'),
            headers={
                "Title": f"This is a test message",
                "Priority": "high",
                "Tags": "warning"
            })
        print("--> Notification sent!")
    except Exception as e:
        print(f"--> Failed to send notification: {e}")
        
message = input('Input message:')
ntfy_topic = input('Input topic:')

send_notification(message, ntfy_topic)