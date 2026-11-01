"""Dependency-free content integrity checks; not a replacement for app input validation.
Run: python validate_package.py [path/to/questions.json]
"""
import json,sys,hashlib
from pathlib import Path
from collections import Counter

def validate(path):
 b=json.loads(path.read_text(encoding='utf-8'));assert b['schemaVersion']=='1.1.0','Unsupported version'
 def unique(items):
  ids=[x['id'] for x in items];assert len(ids)==len(set(ids)),'Duplicate IDs';return set(ids)
 sources=unique(b['sources']);tax=unique(b['taxonomy']);assets=unique(b['assets'])
 parents={t['id']:t['parentId'] for t in b['taxonomy']}
 for t in b['taxonomy']:
  assert t['parentId'] is None or t['parentId'] in tax
  seen=set();cur=t['id']
  while cur is not None:
   assert cur not in seen,'Taxonomy cycle';seen.add(cur);cur=parents[cur]
 for a in b['assets']:
  rel=Path(a['path']);assert not rel.is_absolute() and rel.parts[0]=='assets' and '..' not in rel.parts
  file=(path.parent/rel).resolve();assert file.is_relative_to(path.parent.resolve())
  assert file.is_file(),f'Missing asset {rel}'
  assert hashlib.sha256(file.read_bytes()).hexdigest()==a['sha256'],'Asset digest mismatch'
  assert not (a['role']=='question-exhibit' and a['containsAnswer']),'Exhibit leaks key'
 ids=[q['externalId'] for q in b['questions']];assert len(ids)==len(set(ids)),'Duplicate question identity'
 def refs(rs):
  for r in rs:
   assert r['sourceId'] in sources
   assert all(isinstance(p,int) and p>0 for p in r['pages'])
 def paragraph(t):
  assert isinstance(t,dict) and isinstance(t['text'],str) and t['text'].strip()
  assert t['origin'] in ['assistant-authored','source-verbatim','source-paraphrase','user-authored']
  refs(t['sourceRefs'])
 counts=Counter();rationale_count=0
 for q in b['questions']:
  assert q['prompt'].strip() and isinstance(q['revision'],int) and q['revision']>0
  assert 'status' not in q and 'review' not in q
  assert all(x in tax for x in q['moduleIds']+q['topicIds']);refs(q['provenance']['sourceRefs'])
  for s in q['sourceNumbers']:assert s['sourceId'] in sources and all(p>0 for p in s['pages'])
  for block in q['blocks']:
   assert block['type'] in ['image','code','text']
   if block['type']=='image':assert block['assetId'] in assets
   else:assert block['text'].strip()
  e=q['explanation'];paragraph(e['summary']);paragraph(e['concept'])
  if e['sourceExplanation']:paragraph(e['sourceExplanation'])
  for t in e['commonMistakes']:paragraph(t)
  if e['practicalExample']:paragraph(e['practicalExample']['intro'])
  assert all(i in ids for i in e['relatedQuestionIds'])
  for key in ['optionRationales','matchingRationales','orderingRationales']:
   for r in e[key]:paragraph(r['rationale']);rationale_count+=1
  p=q['payload']
  if q['type'] in ['single','multi']:
   opts=unique(p['options']);key=p['correctOptionIds'];assert len(key)==len(set(key)) and set(key)<=opts
   assert len(key)==p['requiredSelections'] and len(key)==(1 if q['type']=='single' else len(key))
   if q['type']=='multi':assert len(key)>1
   rr=[r['optionId'] for r in e['optionRationales']];assert len(rr)==len(set(rr)) and set(rr)==opts
  elif q['type']=='matching':
   ps=unique(p['prompts']);cs=unique(p['choices']);ms=p['correctMatches']
   assert {m['promptId'] for m in ms}==ps and len(ms)==len(ps)
   vals=[m['choiceId'] for m in ms]
   assert all(v in cs or (v is None and p['allowNoMatch']) for v in vals)
   if not p['allowChoiceReuse']:assert len([v for v in vals if v])==len(set(v for v in vals if v))
   rr=[r['promptId'] for r in e['matchingRationales']];assert len(rr)==len(set(rr)) and set(rr)==ps
  elif q['type']=='ordering':
   items=unique(p['items']);order=p['correctOrderIds'];ds=p['distractorItemIds'];assert len(order+ds)==len(set(order+ds)) and set(order+ds)==items
   rr=[r['itemId'] for r in e['orderingRationales']];assert len(rr)==len(set(rr)) and set(rr)==items
  else:raise AssertionError('Unknown type')
 return dict(questions=len(ids),types=dict(Counter(q['type'] for q in b['questions'])),rationales=rationale_count,assets=len(assets))
if __name__=='__main__':
 result=validate(Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).with_name('questions.json'))
 print(json.dumps({'result':'PASS',**result},indent=2))
