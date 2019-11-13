from hashlib import sha256
import os
import sys

if sys.version_info[0] < 3:
    raise Exception("Must be using Python 3")

current_dir = os.path.dirname(__file__)

adjectives = open(os.path.join(current_dir, "adjectives.txt")).readlines()
nouns = open(os.path.join(current_dir, "nouns.txt")).readlines()
verbs = open(os.path.join(current_dir, "verbs.txt")).readlines()


class Humanhash:
    name = "humanhash"

    def __init__(self, data="", internal_hash=sha256):
        """
            In : Humanhash("malware".encode("utf-8")).digest()
            Out: 'AntiperiodicHyperthermalPerseitiesMachining'
        """

        self.internal_state = internal_hash(data)

    def digest(self):
        return Humanhash._humanhash(self.internal_state.hexdigest())

    def hexdigest(self):
        return self.digest().encode("hex")

    def update(self, data):
        self.internal_state.update(data)

    @property
    def digest_size(self):
        return len(self.digest())

    @property
    def block_size(self):
        return self.internal_state.block_size

    @staticmethod
    def _humanhash(hexdigest):
        """
            In : Humanhash._humanhash("D18C26E029B88F66C159ED502ABB2A86B3805EEEA138098EBA4ED5A763787686")
            Out: 'AntiperiodicHyperthermalPerseitiesMachining'
        """
        data = list(map(lambda x: int(x, 16),
                    map("".join, zip(hexdigest[::2], hexdigest[1::2]))))
        length = len(data)
        target = 4

        # Split data into 4 chunks
        seg_size = length // target
        segments = [data[i * seg_size:(i + 1) * seg_size]
                    for i in range(target)]
        segments[-1] += data[target * seg_size:]

        # Retrieve 4 ints
        vals = []
        for segment in segments:
            bytes_ = b"".join(bytes([x]) for x in segment)
            vals.append(int.from_bytes(bytes_, "little"))
        vals[0] = vals[0] % len(adjectives)
        vals[1] = vals[1] % len(adjectives)
        vals[2] = vals[2] % len(nouns)
        vals[3] = vals[3] % len(verbs)

        out = adjectives[vals[0]].strip().capitalize() + \
            adjectives[vals[1]].strip().capitalize() + \
            nouns[vals[2]].strip().capitalize() + \
            verbs[vals[3]].strip().capitalize()

        return out
