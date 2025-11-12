from datetime import datetime, timedelta
def generate_ics(uid:str, title:str, starts_at:datetime, duration_minutes:int, location:str)->str:
    dtstart=starts_at.strftime("%Y%m%dT%H%M%SZ")
    dtend=(starts_at+timedelta(minutes=duration_minutes)).strftime("%Y%m%dT%H%M%SZ")
    return "\r\n".join([
        "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//PingForBeer//EN",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstart}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{title}",
        f"LOCATION:{location}",
        "END:VEVENT","END:VCALENDAR",""
    ])
