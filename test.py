#!/usr/bin/env python3
"""
TCP Server za sprejemanje podatkov iz ESP32
Poslušaj na portu 8080 in prikazuj prejete podatke
"""

import socket
import json
import datetime
import threading
import sys

# Konfiguracija
HOST = '0.0.0.0'  # Poslušaj na vseh vmesnikih
PORT = 8080

# Statistika
packet_count = 0
last_data = None

def handle_client(conn, addr):
    """Obravnava povezave od odjemalca"""
    global packet_count, last_data
    
    print(f"[{datetime.datetime.now()}] Nova povezava iz {addr}")
    
    try:
        # Preberi podatke
        data = conn.recv(1024)
        if data:
            try:
                # Dekodiranje podatkov
                message = data.decode('utf-8').strip()
                print(f"\n[{datetime.datetime.now()}] Prejeto iz {addr}:")
                print(f"  Raw: {message}")
                
                # Poskusi parsirati kot JSON
                try:
                    json_data = json.loads(message)
                    print(f"  X: {json_data.get('x', 'N/A')} g")
                    print(f"  Y: {json_data.get('y', 'N/A')} g")
                    print(f"  Z: {json_data.get('z', 'N/A')} g")
                    last_data = json_data
                except json.JSONDecodeError:
                    print(f"  (Ni JSON format)")
                    last_data = message
                
                packet_count += 1
                print(f"  Skupaj paketov: {packet_count}")
                
            except UnicodeDecodeError as e:
                print(f"Napaka pri dekodiranju: {e}")
                print(f"Raw bytes: {data.hex()}")
                
    except Exception as e:
        print(f"Napaka pri obravnavi povezave: {e}")
    finally:
        conn.close()
        print(f"[{datetime.datetime.now()}] Povezava zaprta {addr}\n")

def server_status_thread():
    """Periodično izpisuje status strežnika"""
    import time
    while True:
        time.sleep(10)
        print(f"\n--- STATUS ---")
        print(f"Poslušam na {HOST}:{PORT}")
        print(f"Prejetih paketov: {packet_count}")
        if last_data:
            if isinstance(last_data, dict):
                print(f"Zadnji podatki: X={last_data.get('x')}, Y={last_data.get('y')}, Z={last_data.get('z')}")
            else:
                print(f"Zadnji podatki: {last_data}")
        print("---------------\n")

def main():
    """Glavna funkcija strežnika"""
    
    # Pridobi lokalni IP naslov
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        print(f"\n{'='*60}")
        print(f"TCP Server za ESP32 podatke")
        print(f"{'='*60}")
        print(f"Lokalni IP naslov: {local_ip}")
        print(f"Port: {PORT}")
        print(f"\nV STM32 kodi nastavi:")
        print(f"  #define SERVER_IP     \"{local_ip}\"")
        print(f"  #define SERVER_PORT   \"{PORT}\"")
        print(f"{'='*60}\n")
    except Exception as e:
        print(f"Ne morem pridobiti IP naslova: {e}")
        local_ip = "unknown"
    
    # Začni status thread
    status_thread = threading.Thread(target=server_status_thread, daemon=True)
    status_thread.start()
    
    # Ustvari TCP socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as server_socket:
        # Omogoči ponovno uporabo naslova
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        
        try:
            # Poveži socket na naslov in port
            server_socket.bind((HOST, PORT))
            server_socket.listen(5)
            
            print(f"[{datetime.datetime.now()}] Strežnik posluša na {HOST}:{PORT}")
            print("Čakam na povezave...\n")
            
            while True:
                # Sprejmi povezavo
                conn, addr = server_socket.accept()
                
                # Obravnava vsake povezave v ločeni niti
                client_thread = threading.Thread(
                    target=handle_client, 
                    args=(conn, addr)
                )
                client_thread.start()
                
        except KeyboardInterrupt:
            print("\n\nStrežnik zaustavljen s Ctrl+C")
            print(f"Skupaj prejetih paketov: {packet_count}")
            sys.exit(0)
        except Exception as e:
            print(f"Napaka strežnika: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()