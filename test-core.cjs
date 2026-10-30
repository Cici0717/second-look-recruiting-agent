const assert=require('node:assert/strict');
const C=require('./dist/core.js');
let checks=0;function test(name,fn){fn();checks++;console.log('PASS '+name);}
function ready(i){const c=C.cases[i],s=C.fresh(c);s.analyzed=true;s.selected=C.jobs(c,s).filter(j=>j.eligible).map(j=>j.id);s.includeJobs=s.selected.length>0;return[c,s];}
test('five cases retain evidence requirements',()=>{assert.equal(C.cases.length,5);for(const c of C.cases)for(const j of c.jobs)for(const ref of j.refs)assert.ok(c.evidence[ref]);});
test('TC01 enterprise application does not imply platform qualification',()=>{const[c,s]=ready(0);assert.deepEqual(C.chosen(c,s).map(j=>j.id),['J101']);});
test('TC02 shortages cannot override missing SQL evidence',()=>{const[c,s]=ready(1);s.supply=true;assert.deepEqual(C.chosen(c,s).map(j=>j.id),['J201']);});
test('TC04 supply assists ranking only among eligible jobs',()=>{const[c,s]=ready(3);assert.equal(C.jobs(c,s)[0].id,'J401');s.supply=true;assert.equal(C.jobs(c,s)[0].id,'J402');assert.equal(C.chosen(c,s).length,2);});
test('TC05 unknown endorsement yields no recommendation',()=>{const[c,s]=ready(4);assert.equal(C.chosen(c,s).length,0);assert.equal(C.approve(c,s),'');});
test('human no endorsement cannot be overwritten',()=>{const[c,s]=ready(0);s.intent='no';assert.equal(C.chosen(c,s).length,0);assert.notEqual(C.approve(c,s),'');});
test('unapproved send is blocked',()=>{const[c,s]=ready(0);assert.notEqual(C.send(c,s),'');assert.equal(s.sent,null);});
test('editing after approval blocks previous authorization',()=>{const[c,s]=ready(0);assert.equal(C.approve(c,s),'');s.feedback+='补充';assert.notEqual(C.send(c,s),'');assert.equal(s.sent,null);});
test('closed role after approval cannot be sent as invitation',()=>{const[c,s]=ready(0);C.approve(c,s);s.scenario='closed';assert.notEqual(C.send(c,s),'');assert.equal(s.sent,null);});
test('feedback-only scope is respected and duplicate send rejected',()=>{const[c,s]=ready(0);s.includeJobs=false;C.approve(c,s);assert.equal(C.send(c,s),'');assert.deepEqual(s.sent.jobs,[]);assert.notEqual(C.send(c,s),'');assert.equal(C.respond(s,'J101'),'没有已发出的岗位邀请');});
test('sent snapshot is independent from later draft changes',()=>{const[c,s]=ready(0);C.approve(c,s);C.send(c,s);const original=s.sent.feedback;s.feedback='新文本';s.selected=[];assert.equal(s.sent.feedback,original);assert.equal(s.sent.jobs[0].id,'J101');});
test('candidate decline terminates response and invalid job rejected',()=>{const[c,s]=ready(0);C.approve(c,s);C.send(c,s);assert.notEqual(C.respond(s,'J999'),'');assert.equal(C.respond(s,'decline'),'');assert.notEqual(C.respond(s,'J101'),'');});
test('original role advancing cannot trigger rejection message',()=>{const[c,s]=ready(0);s.verdict='推进';assert.notEqual(C.approve(c,s),'');assert.notEqual(C.send(c,s),'');});
console.log(`${checks} checks passed. Local prototype logic only; no backend/model evaluation.`);
