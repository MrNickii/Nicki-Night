import asyncio,json,websockets
rooms={}
async def h(ws):
    me={'ws':ws,'room':None,'in':None,'out':None}
    try:
        async for m in ws:
            try:j=json.loads(m)
            except:continue
            if 'join' in j:
                me.update(room=j['join'],**{'in':j.get('in'),'out':j.get('out')});rooms.setdefault(me['room'],[]).append(me);continue
            for o in list(rooms.get(me['room'],[])):
                if o is not me and o['in']==me['out']:
                    try:await o['ws'].send(m)
                    except:pass
    finally:
        if me['room'] and me in rooms.get(me['room'],[]):rooms[me['room']].remove(me)
async def main():
    async with websockets.serve(h,'127.0.0.1',8765):await asyncio.Future()
asyncio.run(main())
