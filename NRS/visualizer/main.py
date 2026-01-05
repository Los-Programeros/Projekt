import pyqtgraph as pg
from pyqtgraph.Qt import QtCore
import numpy as np
import serial
import serial.tools.list_ports

ports = list(serial.tools.list_ports.comports())

if not ports:
    print("Ni najdenih vrat.")
    exit()

for i, port in enumerate(ports):
    print(f"{i}: {port.device} - {port.description}")

try:
    port_index = int(input('\nVrata: ').strip())
    if port_index < 0 or port_index >= len(ports):
        exit()
    selected_port = ports[port_index].device
except ValueError:
    exit()

try:
    ser = serial.Serial(selected_port, 9600, timeout=0.01)
    print(f"Povezan na {selected_port}")
except Exception as e:
    print(f'Napaka: {e}')
    exit()

MAX_POINTS = 500
x_data = np.zeros(MAX_POINTS)
y_data = np.zeros(MAX_POINTS)
z_data = np.zeros(MAX_POINTS)

app = pg.mkQApp()
win = pg.GraphicsLayoutWidget(title="Pospešek")
win.resize(1200, 600)
plot = win.addPlot(title="Pospešek")
plot.setYRange(-1.5, 1.5)
plot.setLabel('left', 'Pospešek', units='g')
plot.setLabel('bottom', 'Vzorci')
plot.showGrid(x=True, y=True)

plot.addLegend()
curve_x = plot.plot(pen='r', name='X os')
curve_y = plot.plot(pen='g', name='Y os')
curve_z = plot.plot(pen='b', name='Z os')

def update():
    global x_data, y_data, z_data
    
    try:
        lines_read = 0
        while ser.in_waiting and lines_read < 10:
            try:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                if line and ',' in line:
                    parts = line.split(',')
                    if len(parts) == 3:
                        x_val = float(parts[0])
                        y_val = float(parts[1])
                        z_val = float(parts[2])
                        
                        x_data = np.roll(x_data, -1)
                        x_data[-1] = x_val
                        y_data = np.roll(y_data, -1)
                        y_data[-1] = y_val
                        z_data = np.roll(z_data, -1)
                        z_data[-1] = z_val
                        
                lines_read += 1
            except Exception as e:
                print(f"Napaka: {e}")
                pass
        
        curve_x.setData(x_data)
        curve_y.setData(y_data)
        curve_z.setData(z_data)
        
    except Exception as e:
        print(f"Napaka: {e}")
        pass

timer = QtCore.QTimer()
timer.timeout.connect(update)
timer.start(10)

win.show()

try:
    app.exec_()
except KeyboardInterrupt:
    pass
finally:
    ser.close()