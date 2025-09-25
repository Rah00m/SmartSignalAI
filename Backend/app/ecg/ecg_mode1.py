from fastapi import APIRouter
import wfdb
import pandas as pd

router = APIRouter()

@router.get("/channels")
def get_channels():
    record = wfdb.rdrecord('100', pn_dir='mitdb')
    return {"channels": record.sig_name}


@router.get("/signal")
def get_signal(channel: str = "MLII", offset: int = 0, length: int = 3000):
    record = wfdb.rdrecord('100', pn_dir='mitdb')
    df = pd.DataFrame(record.p_signal, columns=record.sig_name)

    if channel not in df.columns:
        return {"error": f"Invalid channel name: {channel}"}

    y = df[channel][offset:offset+length].tolist()
    x = list(range(offset, offset + len(y)))

    return {
        "channel": channel,
        "offset": offset,
        "length": length,
        "x": x,
        "y": y
    }

# uvicorn app.main:app --reload
# http://127.0.0.1:8000/ecg/mode1/channels
# http://127.0.0.1:8000/ecg/mode1/signal?channel=MLII&offset=0&length=3000
