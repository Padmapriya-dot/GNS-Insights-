import urllib.request
req = urllib.request.Request('http://localhost:8000/docs')
with urllib.request.urlopen(req, timeout=10) as r:
    print(r.status)
    print(r.read(200).decode('utf-8', 'ignore'))
