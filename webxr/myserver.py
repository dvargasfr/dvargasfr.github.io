# Python 3 server example
from http.server import BaseHTTPRequestHandler, HTTPServer, SimpleHTTPRequestHandler
import http.server
from http import HTTPStatus
import time
import re
import uuid
import os
import sys
import io
import hashlib
from urllib.parse import urlparse, parse_qs

"""
import qrcode
img = qrcode.make('Some data here')
img.save("some_file.png")
"""

def sha256sum(filename):
    h  = hashlib.sha256()
    b  = bytearray(128*1024)
    mv = memoryview(b)
    with open(filename, 'rb', buffering=0) as f:
        for n in iter(lambda : f.readinto(mv), 0):
            h.update(mv[:n])
    print("h.hexdigest(): " + h.hexdigest())
    return h.hexdigest()

""" https://github.com/sgrontflix/simplehttpserverwithupload/blob/main/main.py """

hostName = "localhost"
serverPort = 8080

def sanitize_filename(filename: str) -> str:
    chars = ['\\', '/', ':', '*', '?', '"', '<', '>', '|']
    filename = filename.translate({ord(x): '' for x in chars}).strip()
    name = re.sub(r'\.[^.]+$', '', filename)
    extension = re.search(r'(\.[^.]+$)', filename)
    extension = extension.group(1) if extension else ''

    return filename if name else f'file_{uuid.uuid4().hex}{extension}'

class MyServer(SimpleHTTPRequestHandler):
    def do_GET(self):
        
        query_components = parse_qs(urlparse(self.path).query)
        model = query_components["model"]
        print(model)

        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        """
        self.wfile.write(bytes("<html><head><title>https://pythonbasics.org</title></head>", "utf-8"))
        self.wfile.write(bytes("<p>Request: %s</p>" % self.path, "utf-8"))
        self.wfile.write(bytes("<body>", "utf-8"))
        self.wfile.write(bytes("<p>This is an example web server.</p>", "utf-8"))
        self.wfile.write(bytes("</body></html>", "utf-8"))
        """
        self.wfile.write(bytes("<html><head><title>upload the file : GFG</title></head>", "utf-8"))
        self.wfile.write(bytes("<body>", "utf-8"))
        self.wfile.write(bytes("<form action=\"/success\" method=\"post\" enctype=\"multipart/form-data\">", "utf-8"))
        self.wfile.write(bytes("<input type=\"file\" name=\"file\"/> <input type=\"submit\" value=\"Upload\">", "utf-8"))
        self.wfile.write(bytes("</form></body></html>", "utf-8"))

    def do_POST(self):
        """
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)

        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write("POST request for {}".format(self.path).encode('utf-8'))
        """
        result, message = self.handle_upload()
        r = []
        enc = sys.getfilesystemencoding()
        r.append('<!DOCTYPE HTML>')
        r.append('<html>\n<title>Upload result</title>')
        r.append('<body>\n<h1>Upload result</h1>')
        if result:
            r.append('<b><font color="green">File(s) successfully uploaded</font></b>: ')
            r.append(f'{", ".join(message)}.')
        else:
            r.append('<b><font color="red">Failed to upload file(s)</font></b>: ')
            r.append(message)
        r.append(f'<br /><br />\n<a href=\"{self.headers["referer"]}\">Go back</a>')
        r.append('</body>\n</html>')

        encoded = '\n'.join(r).encode(enc, 'surrogateescape')
        f = io.BytesIO()
        f.write(encoded)
        f.seek(0)

        self.send_response(HTTPStatus.OK)
        self.send_header('Content-type', 'text/html')
        self.send_header('Content-Length', str(len(encoded)))
        self.end_headers()

        if f:
            self.copyfile(f, self.wfile)
            f.close()

    def handle_upload(self):
        boundary = re.search(f'boundary=([^;]+)', self.headers['content-type']).group(1)
        data = self.rfile.read(int(self.headers['content-length'])).splitlines(True)
        filenames = re.findall(f'{boundary}.+?filename="(.+?)"', str(data))

        if not filenames:
            return False, 'couldn\'t find file name(s).'
        
        filenames = [sanitize_filename(filename) for filename in filenames]
        boundary_indices = list((i for i, line in enumerate(data) if re.search(boundary, str(line))))

        for i in range(len(filenames)):
            file_data = data[(boundary_indices[i] + 4):boundary_indices[i+1]]
            file_data = b''.join(file_data)
            try:
                with open(f'{args.directory}/{filenames[i]}', 'wb') as file:
                    file.write(file_data)
                sha256sum(file)
            except IOError:
                return False, f'couldn\'t save {filenames[i]}.'

        return True, filenames

if __name__ == "__main__":        
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--directory', '-d', default=os.getcwd(),
                        help='Specify alternative directory '
                        '[default: current directory]')
    args = parser.parse_args()

    print("Server started http://%s:%s" % (hostName, serverPort))
    webServer = HTTPServer((hostName, serverPort), MyServer)
    
    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        pass

    webServer.server_close()
    print("Server stopped.")