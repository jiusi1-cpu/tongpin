(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.TongpinFinder=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const skills={
    '设计创意':['品牌设计','海报设计','UI / UX','插画','PPT设计'],
    '技术开发':['网页开发','小程序','全栈开发','数据分析','App开发'],
    'AI 与自动化':['AI 工具','工作流自动化','AI绘画','AI视频','智能体'],
    '内容创作':['文案策划','视频剪辑','摄影','短视频','翻译'],
    '营销运营':['社群运营','用户增长','活动策划','电商运营','品牌推广'],
    '商业服务':['商业分析','项目管理','财税','法律服务','供应链'],
    '科研与教育':['论文辅导','统计分析','课程教学','英语','实验设计'],
    '资源对接':['供应商对接','场地资源','渠道合作','招聘对接'],
    '生活技能':['咖啡','户外徒步','手作','健身','烹饪'],
    '其他能力':[]
  };
  const groups=[
    ['做网站','建站','网站开发','网页开发','全栈开发','前端开发','网页','website'],
    ['做小程序','小程序开发','小程序'],['做海报','海报设计','海报'],
    ['做品牌','品牌设计','视觉设计','vi设计'],['界面设计','ui / ux','ui设计','ux设计'],
    ['剪视频','剪辑','视频剪辑','视频后期'],['拍视频','视频拍摄','短视频'],
    ['拍照','摄影','拍摄照片'],['写文案','文案','文案策划'],
    ['做ppt','ppt设计','幻灯片','演示文稿'],['自动化','工作流自动化','工作流'],
    ['ai工具','ai 工具','人工智能工具'],['ai绘画','ai画图','文生图'],
    ['ai视频','ai漫剧','文生视频'],['智能体','agent'],
    ['社群','社群运营','群运营'],['拉新','用户增长','增长运营'],
    ['电商','电商运营','网店运营'],['数据分析','统计分析','数据统计'],
    ['供应商','供应商对接','找供应商'],['招人','招聘对接','招聘'],
    ['英语','英文'],['论文','论文辅导'],['翻译','笔译','口译']
  ];
  const normalize=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
  const cache=new WeakMap();
  function fields(p){if(cache.has(p))return cache.get(p);const values=[['名称',p.name,100],['城市',p.city,35],...(p.tags||[]).map(s=>['技能',s,70]),['简介',p.headline,40],...(p.categories||[]).map(s=>['领域',s,25]),['介绍',p.bio,12]].filter(x=>x[1]).map(([label,text,weight])=>({label,text,norm:normalize(text),weight}));cache.set(p,values);return values;}
  function terms(query){return normalize(query).split(/[\s,，、;；]+/).filter(Boolean).slice(0,12);}
  function alternatives(term){const matching=groups.find(g=>g.some(s=>normalize(s)===term));return matching?[...new Set(matching.map(normalize))]:[term];}
  function rank(records,{query='',category='全部群友',city='',sort='relevance'}={}){
    const ts=terms(query);const output=[];
    for(const profile of records){
      if(category!=='全部群友'&&!profile.categories.includes(category))continue;
      if(city&&normalize(profile.city)!==normalize(city))continue;
      const fs=fields(profile);let score=0;const reasons=[];
      for(const term of ts){let best=null;
        for(const word of alternatives(term))for(const f of fs){
          if(!f.norm.includes(word))continue;
          const points=f.weight+(f.norm===word?25:0)+(word===term?10:0);
          if(!best||points>best.points)best={points,label:f.label,text:f.text};
        }
        if(!best){score=-1;break;}
        score+=best.points;const reason=best.label+'：'+best.text;if(!reasons.includes(reason))reasons.push(reason);
      }
      if(score>=0)output.push({profile,score,reasons});
    }
    output.sort((a,b)=>{if(sort==='relevance'&&ts.length&&b.score!==a.score)return b.score-a.score;if(sort==='name')return a.profile.name.localeCompare(b.profile.name,'zh-CN')||a.profile.id.localeCompare(b.profile.id);return b.profile.created-a.profile.created||a.profile.id.localeCompare(b.profile.id);});
    return output;
  }
  return {rank,skills,normalize};
});
