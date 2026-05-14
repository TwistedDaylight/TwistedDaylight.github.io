#!/usr/bin/env python3
"""
Pocket Pomo — Termux notification bridge
=========================================
Fires a termux-notification when your Pocket Pomo focus timer ends,
even when the browser is in the background.

One-time setup
--------------
1. In Pocket Pomo: tap "Link Termux file" → save to Downloads as pomo-timer.json
2. In Termux:
       pkg install termux-api
       nohup python3 ~/storage/downloads/pomo-watch.py &

The '&' sends it to the background. It stays alive until you reboot or kill it:
       kill %1          # if it's the only background job
       pkill -f pomo-watch

Tip: add the nohup line to ~/.bashrc so it starts automatically with Termux.
"""
import json, os, sys, subprocess, time

TIMER_FILE = sys.argv[1] if len(sys.argv) > 1 else \
    os.path.expanduser('~/storage/downloads/pomo-timer.json')

def read_timer():
    try:
        with open(TIMER_FILE) as f:
            d = json.load(f)
        return int(d.get('endTime', 0)), str(d.get('task', ''))
    except Exception:
        return 0, ''

def notify(task):
    body = f'Time for a break!  ({task})' if task else 'Time for a break!'
    subprocess.run([
        'termux-notification',
        '--title', '🍅 Pomo done!',
        '--content', body,
        '--id', '42',
        '--priority', 'high',
    ], capture_output=True)
    subprocess.run(['termux-vibrate', '-d', '500'], capture_output=True)

print(f'Pocket Pomo watching: {TIMER_FILE}')
print('Ctrl+C  or  pkill -f pomo-watch  to stop\n')

fired_end = 0

while True:
    try:
        end_ms, task = read_timer()
        now_ms = int(time.time() * 1000)

        if end_ms > 0 and end_ms != fired_end:
            remaining_s = (end_ms - now_ms) / 1000
            if remaining_s <= 0:
                notify(task)
                print(f'  → notified  ({task or "focus timer"})')
                fired_end = end_ms
                sleep_s = 3
            elif remaining_s < 10:
                sleep_s = 0.5           # nearly done — poll fast
            elif remaining_s < 60:
                sleep_s = 2
            else:
                sleep_s = min(30, remaining_s - 10)  # wake 10 s before end
        else:
            if end_ms == 0:
                fired_end = 0           # timer was cleared/cancelled
            sleep_s = 3

    except KeyboardInterrupt:
        print('\nStopped.')
        sys.exit(0)
    except Exception:
        sleep_s = 3

    time.sleep(sleep_s)
