<div className="p-10 min-h-screen bg-surface flex-1 w-full">

<!-- Header Section -->
<header className="flex justify-between items-end mb-12">
<div className="space-y-1">
<h1 className="text-6xl font-black font-headline tracking-[-0.04em] text-on-background">SYSTEM<br/><span className="text-primary-fixed-dim">OVERVIEW</span></h1>
<p className="text-on-surface-variant font-label text-sm tracking-[0.2em] uppercase pt-4 opacity-60">Real-time engagement telemetry</p>
</div>
<div className="flex gap-4 mb-2">
<div className="glass-panel inner-glow px-6 py-3 rounded-xl flex items-center gap-3">
<div className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></div>
<span className="text-xs font-label uppercase tracking-widest text-tertiary">Live System</span>
</div>
<div className="glass-panel inner-glow px-4 py-3 rounded-xl">
<span className="material-symbols-outlined text-primary" data-icon="calendar_today">calendar_today</span>
</div>
</div>
</header>
<!-- Analytics Bento Grid -->
<section className="grid grid-cols-12 gap-6 mb-12">
<!-- Spin Volume Card -->
<div className="col-span-8 glass-panel inner-glow rounded-xl p-8 relative overflow-hidden group">
<div className="flex justify-between items-start relative z-10">
<div>
<p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-1">Total Engagement</p>
<h3 className="text-4xl font-headline font-bold text-on-background tracking-tight">Spin Volume</h3>
</div>
<div className="text-right">
<span className="text-tertiary text-2xl font-headline font-bold">+24.8%</span>
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-50">vs last period</p>
</div>
</div>
<!-- Mock Graph Visualization -->
<div className="mt-12 h-48 w-full flex items-end gap-2">
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[40%]"></div>
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[55%]"></div>
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[45%]"></div>
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[70%]"></div>
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[60%]"></div>
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[85%]"></div>
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[75%]"></div>
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[95%]"></div>
<div className="flex-1 bg-primary-container/20 hover:bg-primary-container/40 transition-colors rounded-t-sm h-[80%]"></div>
<div className="flex-1 bg-primary-container/30 hover:bg-primary-container/50 transition-colors rounded-t-sm h-[100%] neon-glow"></div>
</div>
<div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[60px] rounded-full group-hover:bg-primary/20 transition-all"></div>
</div>
<!-- Conversion Rate Card -->
<div className="col-span-4 glass-panel inner-glow rounded-xl p-8 relative overflow-hidden flex flex-col justify-between">
<div>
<p className="text-xs font-label uppercase tracking-widest text-on-surface-variant mb-1">Conversion Metric</p>
<h3 className="text-3xl font-headline font-bold text-on-background tracking-tight">C.R. Efficiency</h3>
</div>
<div className="flex flex-col items-center justify-center flex-1 py-4">
<div className="relative w-32 h-32 flex items-center justify-center">
<svg className="w-full h-full -rotate-90">
<circle className="text-surface-container-highest" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8"></circle>
<circle className="text-tertiary" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray="364.4" strokeDashoffset="100" strokeWidth="8"></circle>
</svg>
<div className="absolute inset-0 flex flex-col items-center justify-center">
<span className="text-2xl font-headline font-bold text-on-background">72%</span>
<span className="text-[8px] font-label uppercase tracking-widest text-on-surface-variant">Optimal</span>
</div>
</div>
</div>
<div className="space-y-3">
<div className="flex justify-between items-center text-[10px] font-label uppercase tracking-widest">
<span className="text-on-surface-variant opacity-60">Retention Rate</span>
<span className="text-on-background">88%</span>
</div>
<div className="w-full h-1 bg-surface-container-highest rounded-full">
<div className="h-full bg-primary rounded-full w-[88%]"></div>
</div>
</div>
</div>
<!-- Secondary Analytics Row -->
<div className="col-span-4 glass-panel inner-glow rounded-xl p-6 flex items-center gap-4">
<div className="p-4 bg-tertiary/10 rounded-xl">
<span className="material-symbols-outlined text-tertiary" data-icon="groups">groups</span>
</div>
<div>
<h4 className="text-2xl font-headline font-bold text-on-background">12,401</h4>
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Active Players</p>
</div>
</div>
<div className="col-span-4 glass-panel inner-glow rounded-xl p-6 flex items-center gap-4">
<div className="p-4 bg-primary/10 rounded-xl">
<span className="material-symbols-outlined text-primary" data-icon="payments">payments</span>
</div>
<div>
<h4 className="text-2xl font-headline font-bold text-on-background">$42.8k</h4>
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Revenue Generated</p>
</div>
</div>
<div className="col-span-4 glass-panel inner-glow rounded-xl p-6 flex items-center gap-4">
<div className="p-4 bg-secondary/10 rounded-xl">
<span className="material-symbols-outlined text-secondary" data-icon="rocket_launch">rocket_launch</span>
</div>
<div>
<h4 className="text-2xl font-headline font-bold text-on-background">1,029</h4>
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Spin Velocity</p>
</div>
</div>
</section>
<!-- Wheel Management List -->
<section className="space-y-6">
<div className="flex justify-between items-center px-2">
<h2 className="text-2xl font-headline font-bold text-on-background tracking-tight">Active Deployments</h2>
<div className="flex gap-4">
<button className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors">View All</button>
<button className="text-[10px] font-label uppercase tracking-widest text-primary-fixed-dim hover:text-primary transition-colors flex items-center gap-2">
                        Filter By Status <span className="material-symbols-outlined text-xs" data-icon="filter_list">filter_list</span>
</button>
</div>
</div>
<div className="space-y-3">
<!-- Wheel Item 1 -->
<div className="group relative bg-surface-container-low hover:bg-surface-bright transition-all duration-300 rounded-xl p-1 inner-glow">
<div className="bg-surface-container-low group-hover:bg-surface-container rounded-lg p-5 flex items-center justify-between transition-colors">
<div className="flex items-center gap-6">
<div className="w-16 h-16 rounded-lg bg-surface-container-highest overflow-hidden">
<img className="w-full h-full object-cover" data-alt="high-tech neon circular graphic with glowing segments on deep black background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtjFX80P2gG77rcac821qMsXzHT9lqQnUVoTPOWU2WtVKBoc2UQf6cbZw1XYa9uq5QrngRKHul6r2Jku0ndi6NjlqlmTrOszR3OYd9ug4JmpqHUhOdjnkZcMoiOfJsqDIkzVxGdUO054Gs9TwP8gwP9riaSxTzkafiRMJbhbhvkUqqU1DtPOlLNEFUikPvSjfIZLq6D4NNbywYNQJwIQvBvMNycRteDV8ahNMPWOx2JkT21-3URKT4zFaW8IY99EwtSSAo4vbwpYN-"/>
</div>
<div>
<h4 className="text-lg font-headline font-bold text-on-background">Cyberpunk Neon Roulette</h4>
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-60">Created Oct 24, 2024 • 12 Active Rewards</p>
</div>
</div>
<div className="flex items-center gap-12">
<div className="text-center">
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Total Spins</p>
<span className="font-headline font-bold text-on-background">84,209</span>
</div>
<div className="px-4 py-1.5 rounded-full bg-tertiary-container/30 border border-tertiary/20 flex items-center gap-2">
<div className="w-1.5 h-1.5 rounded-full bg-tertiary neon-glow"></div>
<span className="text-[10px] font-label uppercase tracking-widest text-tertiary font-bold">Live</span>
</div>
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</div>
</div>
</div>
<!-- Wheel Item 2 -->
<div className="group relative bg-surface-container-low hover:bg-surface-bright transition-all duration-300 rounded-xl p-1 inner-glow">
<div className="bg-surface-container-low group-hover:bg-surface-container rounded-lg p-5 flex items-center justify-between transition-colors">
<div className="flex items-center gap-6">
<div className="w-16 h-16 rounded-lg bg-surface-container-highest overflow-hidden">
<img className="w-full h-full object-cover" data-alt="abstract violet energy vortex with crystalline shards and soft purple lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD85l_WRUyUMRUP-kFsrGJhZDQNem76FydN7JLsEcS6bsqFrJh3OKKvieoWRInogA-THgvfxjvoe3l_MXwUZlBJlOBtt1rzWBpbzbGAued66HooJe-Hb63qbTBg_wCew_OyNqkfaabB3FwtFzdtc1KBMYgcLeqS6MmV_BgjlEkRSy3Br8M3q6tJEZVxmoy2FLCBQ_UbyuXTw5ydCimRF7iGuxIsETEg3b8ciNlySzTpv4piA8BQ4HJGT9RwtCVsjIjuwpJXWzPRz0dV"/>
</div>
<div>
<h4 className="text-lg font-headline font-bold text-on-background">Vanguard Loot Matrix</h4>
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-60">Created Nov 02, 2024 • 8 Active Rewards</p>
</div>
</div>
<div className="flex items-center gap-12">
<div className="text-center">
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Total Spins</p>
<span className="font-headline font-bold text-on-background">12,551</span>
</div>
<div className="px-4 py-1.5 rounded-full bg-tertiary-container/30 border border-tertiary/20 flex items-center gap-2">
<div className="w-1.5 h-1.5 rounded-full bg-tertiary neon-glow"></div>
<span className="text-[10px] font-label uppercase tracking-widest text-tertiary font-bold">Live</span>
</div>
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</div>
</div>
</div>
<!-- Wheel Item 3 (Draft) -->
<div className="group relative bg-surface-container-low hover:bg-surface-bright transition-all duration-300 rounded-xl p-1 inner-glow opacity-70 hover:opacity-100">
<div className="bg-surface-container-low group-hover:bg-surface-container rounded-lg p-5 flex items-center justify-between transition-colors">
<div className="flex items-center gap-6">
<div className="w-16 h-16 rounded-lg bg-surface-container-highest overflow-hidden grayscale">
<img className="w-full h-full object-cover" data-alt="minimalist architectural sphere with geometric patterns and soft studio lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzRp-grq-YXXB7Sq9GE9MO9s9hezyVigkP09A42e-aIsxNNgHhO3N6GbmBy18oagnpyLKOFWNJfEXfoReCsYPtXNPOYZhuU-_yMVr2TCsBPgyJfdsmz8SideW8OyWxGI7WZoXXuFDcUiIqCKXnb8b9HL9T2rsbXU9plSXSzUHhd2uMiOTCMtiz9OZtGsJ9X5qvZPfXyKE0rkWkRF08v_NMzcx4A8vJMNDtWBQUFwSrt9QHwuvwBpQrLP6qwsbFbXHzPk_9ZaZgXZb5"/>
</div>
<div>
<h4 className="text-lg font-headline font-bold text-on-background">Holiday Reward Core</h4>
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant opacity-60">Modified 2 hours ago • Configuration Pending</p>
</div>
</div>
<div className="flex items-center gap-12">
<div className="text-center">
<p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">Total Spins</p>
<span className="font-headline font-bold text-on-background opacity-40">—</span>
</div>
<div className="px-4 py-1.5 rounded-full bg-surface-container-highest border border-white/5 flex items-center gap-2">
<div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40"></div>
<span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant/60 font-bold">Draft</span>
</div>
<button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
<span className="material-symbols-outlined" data-icon="more_vert">more_vert</span>
</button>
</div>
</div>
</div>
</div>
</section>
<!-- Footer Anchor -->
<footer className="mt-20 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto pb-12">
<div className="flex items-center gap-6 mb-6 md:mb-0">
<span className="font-headline font-bold text-[#d2bbff]">SpinPlatform</span>
<p className="font-body text-xs tracking-normal text-[#e4e1ed]/40">© 2024 SpinPlatform Editorial. All rights reserved.</p>
</div>
<div className="flex gap-8">
<a className="font-body text-xs tracking-normal text-[#e4e1ed]/40 hover:text-[#4edea3] transition-opacity duration-200" href="#">Privacy Policy</a>
<a className="font-body text-xs tracking-normal text-[#e4e1ed]/40 hover:text-[#4edea3] transition-opacity duration-200" href="#">Terms of Service</a>
<a className="font-body text-xs tracking-normal text-[#e4e1ed]/40 hover:text-[#4edea3] transition-opacity duration-200" href="#">API Docs</a>
<a className="font-body text-xs tracking-normal text-[#e4e1ed]/40 hover:text-[#4edea3] transition-opacity duration-200" href="#">Status</a>
</div>
</footer>

</div>