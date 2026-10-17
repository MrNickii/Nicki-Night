import re
base='/tmp/claude-0/-home-claude/932a9474-b5a9-51c3-b72c-125d04efc675/scratchpad/'
head=open(base+'overlay/head.html').read()
rig=open(base+'rig8/rig8.js').read()+'\n'+open(base+'rig8/vnn-avatar.js').read()
art=open(base+'art_room.b64').read().strip()
main=open(base+'overlay/main.js').read().replace('__ART__',art)
full=head+rig+'\n</script>\n<script>\n(function () {\n  var CATALOG = VNNA.CATALOG;\n'+main
open(base+'virtual-nicki-night-overlay.html','w').write(full.replace('__SESSION__','2F2NY2V4xg'))
open(base+'overlay/_blank.html','w').write(full.replace('__SESSION__',''))
print(len(full))
