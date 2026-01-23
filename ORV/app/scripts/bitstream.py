class BitStream:
    def __init__(self, data=None):
        self.bit_list = []
        self.bit_string = ""
        self.pos = 0
        
        if data is not None:
            temp_list = []
            for b in data:
                temp_list.append(format(b, '08b'))
            self.bit_string = "".join(temp_list)

    def write_bits(self, val, n_bits):
        binary = format(val, 'b')
        
        while len(binary) < n_bits:
            binary = "0" + binary
            
        self.bit_list.append(binary)

    def read_bits(self, n_bits):
        if self.pos + n_bits > len(self.bit_string):
            return 0
            
        chunk = self.bit_string[self.pos : self.pos + n_bits]
        self.pos += n_bits
        
        return int(chunk, 2)

    def get_bytes(self):
        full_string = "".join(self.bit_list)
        
        while len(full_string) % 8 != 0:
            full_string += "0"
            
        output = bytearray()
        for i in range(0, len(full_string), 8):
            byte_str = full_string[i : i + 8]
            output.append(int(byte_str, 2))
            
        return output
