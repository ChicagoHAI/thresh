import{_ as s,g as d,d as _,a as l,j as i}from"./js-yaml-5bb7863c.js";import{c,a as m,b as u,o as f}from"./index-91b0591f.js";const r={key:0},p={data(){return{data:null,consumed_config:null}},props:["template"],methods:{set_data(a){this.data=a},set_config(a){this.consumed_config=a}},created:async function(){let a=this.template,e=d();e==null&&(e=`data/${a}.json`),_(e).then(t=>{this.set_data(t)});let n=`templates/${a}.yml`;l(n).then(t=>{const o=i.load(t);this.set_config(o)})}},y=Object.assign(p,{__name:"Viewer",setup(a){return(e,n)=>e.consumed_config!=null&&e.consumed_config!=null&&e.data!=null&&e.data!=null?(f(),c("main",r,[m(s,{input_data:{data:e.data},consumed_config:{consumed_config:e.consumed_config}},null,8,["input_data","consumed_config"])])):u("",!0)}});export{y as default};