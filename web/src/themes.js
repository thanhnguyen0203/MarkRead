const rows=[
 ['dark','Tối',false,'#202326','#c8d0cb','#e8ece9','#9eaaa3','#91c7b0','#39413b','#262e29','#191e1b','#c8a8d9','#b2c48a','#1b1e20','#282c2f','#2b3934'],
 ['light','Sáng',true,'#ffffff','#38433c','#24352b','#687a6e','#33795a','#dfe7e1','#f1f6f2','#f2f5f3','#8857a4','#537a38','#f5f6f5','#eef1ef','#e2eee7'],
 ['sepia','Giấy',true,'#f5efdf','#514a3b','#443d2b','#7c715a','#72733c','#dcd3bc','#ede6d3','#e9e2d0','#965b77','#647240','#ebe4d3','#e5ddc9','#dfdfc7'],
 ['black','Đen OLED',false,'#080909','#c5d1c9','#e5efe8','#92a398','#9dcea9','#2e3a32','#141c16','#111713','#c7a0d4','#b7cc90','#101211','#1c201e','#223229'],
 ['tokyo-night','Tokyo Night',false,'#1a1b26','#a9b1d6','#c0caf5','#9aa5ce','#7aa2f7','#343b58','#24283b','#16161e','#bb9af7','#9ece6a','#16161e','#24283b','#2c3554'],
 ['tokyo-light','Tokyo Night Light',true,'#e1e2e7','#343b58','#1a1b26','#586381','#34548a','#bbc0cc','#d5d6db','#d5d6db','#5a4a78','#33635c','#d5d6db','#cdd0d8','#c1c9db'],
 ['blue-gray','Xanh xám',false,'#263238','#d1dce0','#edf3f5','#a3b8c2','#89c4d6','#435861','#2e4149','#1e2a30','#c7a2ce','#b3cd9c','#202c32','#31454e','#36535f'],
 ['nord','Nord',false,'#2e3440','#d8dee9','#eceff4','#aab8cc','#88c0d0','#4c566a','#3b4252','#272d38','#b48ead','#a3be8c','#272d38','#3b4252','#43556b'],
 ['dracula','Dracula',false,'#282a36','#f8f8f2','#ffffff','#a6b1d7','#bd93f9','#45485e','#343746','#21222c','#ff79c6','#f1fa8c','#21222c','#343746','#45405b'],
 ['rose-pine','Rosé Pine',false,'#191724','#e0def4','#f5e8ef','#a7a0bb','#ebbcba','#403b52','#26233a','#151320','#c4a7e7','#f6c177','#1f1d2e','#2a273f','#3c3147'],
 ['forest','Rừng xanh',false,'#1e2924','#ccdbce','#edf4e9','#9db6a4','#a4c992','#405747','#293b2f','#18211c','#ccb1ce','#dbcf91','#18231d','#2b3c30','#364e36'],
 ['gruvbox','Gruvbox',false,'#282828','#ebdbb2','#fbf1c7','#bdae93','#d8a657','#504945','#32302f','#1d2021','#d3869b','#b8bb26','#1d2021','#3c3836','#504536']
];
const keys=['bg','text','heading','muted','accent','line','quote','code','syntax1','syntax2','panel','surface','selected'];
export const themes=Object.fromEntries(rows.map(([id,name,light,...colors])=>[id,{name,light,palette:Object.fromEntries(keys.map((key,i)=>[key,colors[i]]))}]));
