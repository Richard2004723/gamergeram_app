import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- MOCK DATA AND UTILITIES (Firebase has been disconnected) ---

// Define a stable set of mock posts
const initialMockPosts = [
    {
        id: 'post1', userId: 'mock-user-id', username: 'gamer_tester',
        caption: 'New season, new grind! Hitting Radiant this week. Wish me luck!',
        tags: '#Valorant #Gaming #Grind', tagsArray: ['#Valorant', '#Gaming', '#Grind'],
        imageUrl: 'https://placehold.co/600x600/1e1e1e/FFFFFF?text=VALORANT+CLIP',
        likes: ['mock-user-id', 'other-id-1'],
        comments: [
            { userId: 'other-id-1', username: 'pro_gamer_x', text: 'You got this!', createdAt: new Date(Date.now() - 3600000) },
            { userId: 'other-id-2', username: 'stream_fan', text: 'What agent are you maining?', createdAt: new Date(Date.now() - 1800000) }
        ],
        createdAt: new Date(Date.now() - 7200000)
    },
    {
        id: 'post2', userId: 'other-id-3', username: 'apex_legend',
        caption: 'Loving the new map! Found a new hiding spot for Pathfinder. #ApexLegends',
        tags: '#ApexLegends #NewMap', tagsArray: ['#ApexLegends', '#NewMap'],
        imageUrl: 'https://placehold.co/600x600/3c3c3c/FFFFFF?text=APEX+WIN',
        likes: ['mock-user-id'],
        comments: [],
        createdAt: new Date(Date.now() - 86400000)
    }
];

// Define a stable mock profile for the current user
const mockCurrentUserProfile = {
    id: 'mock-user-id', 
    username: 'gamer_tester', 
    email: 'mock@example.com', 
    followers: ['id1', 'id2', 'id3'], 
    following: ['apex_legend_id', 'other_user_id'],
    bio: 'This is a UI Concept. All data is mock and persistent only for this session. Welcome to GamerGram!',
    isBanned: false, 
    createdAt: new Date(),
    links: ['https://twitch.tv/concept_user', 'https://youtube.com/concept_user'], 
    blockedUsers: [], 
    pronouns: 'They/Them', 
    category: 'UI Concept Lead' 
};

// Define other mock user profiles for lookup
const mockOtherProfiles = {
    'apex_legend': { id: 'apex_legend_id', username: 'apex_legend', bio: 'I only play Apex.', followers: ['mock-user-id'], following: [], links: [] },
    'pro_gamer_x': { id: 'other-id-1', username: 'pro_gamer_x', bio: 'Retired pro.', followers: [], following: [], links: [] }
};

const fetchUserProfileByUsername = async (db, username) => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check if the current mock user is requested
    if (username === mockCurrentUserProfile.username) {
        return mockCurrentUserProfile;
    }
    
    // Check other mock profiles
    const profile = mockOtherProfiles[username];
    if (profile) {
        return profile;
    }
    
    // Default mock data for any other user
    return { 
        id: `${username}_id`, 
        username: username, 
        bio: `This is the profile of ${username}. This is a mock profile!`,
        followers: [], 
        following: [],
        links: [], 
        pronouns: '', 
        category: ''
    };
};

// --- GLOBAL VARIABLES ARE NOW UNUSED ---
const appId = 'mock-app-id';


// --- HELPER COMPONENTS (ICONS) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const ExploreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const CreatePostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>;
const HeartIcon = ({ isLiked }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={`transition-all duration-200 ${isLiked ? 'fill-red-500 stroke-red-500' : 'fill-transparent stroke-current'}`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" y="7" height="7"></rect></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;


// --- NOTIFICATION COMPONENT ---
const Notification = ({ message, isError }) => (
    <div className={`p-4 rounded-lg shadow-lg text-white animate-fade-in ${isError ? 'bg-red-500' : 'bg-green-500'}`}>
        {message}
    </div>
);

// --- AUTHENTICATION PAGE COMPONENT (MOCKED) ---
const AuthPage = ({ showNotification, setMockUser, setCurrentUserProfile }) => {
    const [authMode, setAuthMode] = useState('signin');
    const [isLoading, setIsLoading] = useState(false);

    // MOCK: This effect replaces the Firebase auth listener
    useEffect(() => {
        // Since we are mocking, we assume user is NOT logged in initially if we render this page
    }, []);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { email, username, password } = e.target.elements;
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

        // MOCK: Simple validation
        if (password.value.length < 6) {
             showNotification("Password must be at least 6 characters.", true);
             setIsLoading(false);
             return;
        }

        // MOCK: Simulate successful signup but require sign-in
        showNotification("Account created! Please log in (UI Concept Only).");
        setAuthMode('signin');
        setIsLoading(false);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { email, password } = e.target.elements;
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

        // MOCK: Simulate successful sign-in by setting mock user state
        const userEmail = email.value.toLowerCase();
        
        const mockUser = { uid: userEmail, email: userEmail, isAnonymous: false };
        const mockProfile = { 
            id: userEmail, 
            username: userEmail.split('@')[0], 
            email: userEmail, 
            followers: [], 
            following: [],
            bio: 'Welcome! You signed in with mock data.',
            isBanned: false, 
            createdAt: new Date(),
            links: [], 
            blockedUsers: [], 
            pronouns: '', 
            category: '' 
        };
        
        setMockUser(mockUser);
        setCurrentUserProfile(mockProfile);
        
        showNotification(`Signed in as ${mockProfile.username} (Mock Mode)!`);
        setIsLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        
        showNotification("Password reset email sent (UI Concept Only)!");
        setIsLoading(false);
    };
    
    const handleSetAuthMode = (mode) => {
        setAuthMode(mode);
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-black p-4 text-white">
            <div className="w-full max-w-sm">
                {authMode === 'signin' && (
                    <div className="p-8 space-y-6 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] animate-fade-in">
                        <h2 className="text-3xl font-bold text-center"><span className="text-[#A78BFA]">Gamer</span>Gram (Concept)</h2>
                        <form onSubmit={handleSignIn} className="space-y-4">
                            <input name="email" type="email" placeholder="Email (Any email works)" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                            <input name="password" type="password" placeholder="Password (Any password works)" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                            <div className="text-right">
                                <button type="button" onClick={() => handleSetAuthMode('forgot')} className="text-sm font-medium text-violet-400 hover:underline">Forgot Password?</button>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500">{isLoading ? 'Logging in...' : 'Log In'}</button>
                        </form>
                        <p className="text-center text-sm text-gray-400">Don't have an account? <button onClick={() => handleSetAuthMode('signup')} className="font-bold text-[#A78BFA] hover:underline cursor-pointer">Sign Up</button></p>
                    </div>
                )}
                {authMode === 'signup' && (
                     <div className="p-8 space-y-6 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] animate-fade-in">
                        <h2 className="text-3xl font-bold text-center">Sign Up for <span className="text-[#A78BFA]">Gamer</span>Gram</h2>
                        <form onSubmit={handleSignUp} className="space-y-4">
                             <input name="email" type="email" placeholder="Email" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                             <input name="username" type="text" placeholder="Username" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                             <input name="password" type="password" placeholder="Password (min. 6 characters)" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                             <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500">{isLoading ? 'Creating Account...' : 'Sign Up'}</button>
                        </form>
                        <p className="text-center text-sm text-gray-400">Have an account? <button onClick={() => handleSetAuthMode('signin')} className="font-bold text-[#A78BFA] hover:underline cursor-pointer">Log In</button></p>
                    </div>
                )}
                {authMode === 'forgot' && (
                     <div className="p-8 space-y-6 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] animate-fade-in">
                        <h2 className="text-3xl font-bold text-center">Reset Password</h2>
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <input name="email" type="email" placeholder="Email" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                            <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500">{isLoading ? 'Sending...' : 'Send Reset Link'}</button>
                        </form>
                        <p className="text-center text-sm text-gray-400"><button onClick={() => handleSetAuthMode('signin')} className="font-bold text-[#A78BFA] hover:underline cursor-pointer">Back to Log In</button></p>
                    </div>
                )}
            </div>
        </main>
    );
};


// --- LAYOUT COMPONENT ---
const Layout = ({ currentUserProfile, children, navigate, setMockUser, setCurrentUserProfile }) => {
    const [activePage, setActivePage] = useState('home');

    useEffect(() => {
        const handleHashChange = () => {
             const hash = window.location.hash.substring(1);
             const [pageId] = hash.split('=');
             setActivePage(pageId || 'home');
        }
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    
    if (!currentUserProfile) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Profile...</div>;
    }

    const handleLogout = () => {
        setMockUser(null);
        setCurrentUserProfile(null);
        window.location.hash = ''; // Clear hash
    }

    const navLinkClasses = (page) => `nav-link text-gray-300 hover:text-white transition duration-200 flex items-center p-2 rounded-lg ${activePage === page ? 'text-violet-400 bg-gray-900' : ''}`;
    
    return (
        <div className="antialiased text-gray-200 bg-black min-h-screen">
            <aside className="hidden md:flex fixed top-0 left-0 h-full w-60 bg-black border-r border-gray-800 p-6 flex-col z-10">
                 <h1 className="text-2xl font-bold text-white mb-10"><span className="text-[#A78BFA]">Gamer</span>Gram (Concept)</h1>
                <nav className="flex flex-col space-y-4">
                    <button onClick={() => navigate('home')} className={navLinkClasses('home')}><HomeIcon /><span className="ml-4 text-lg">Home</span></button>
                    <button onClick={() => navigate('explore')} className={navLinkClasses('explore')}><ExploreIcon /><span className="ml-4 text-lg">Explore</span></button>
                    <button onClick={() => navigate('upload')} className={navLinkClasses('upload')}><CreatePostIcon /><span className="ml-4 text-lg">Create Post</span></button>
                    <button onClick={() => navigate('profile', { username: currentUserProfile.username })} className={navLinkClasses('profile')}><ProfileIcon /><span className="ml-4 text-lg">{currentUserProfile.username}</span></button>
                </nav>
                 <div className="mt-auto">
                    <button onClick={handleLogout} className="text-gray-400 hover:text-white transition duration-200 flex items-center p-2 rounded-lg w-full"><LogoutIcon /><span className="ml-4 text-lg">Log Out</span></button>
                </div>
            </aside>
            <main className="md:pl-60 pb-16 md:pb-0">
                {children}
            </main>
             <nav className="md:hidden fixed bottom-0 left-0 w-full h-[60px] bg-black border-t border-gray-800 flex justify-around items-center z-50">
                <button onClick={() => navigate('home')} className={activePage === 'home' ? 'text-violet-400' : 'text-gray-400'}><HomeIcon /></button>
                <button onClick={() => navigate('explore')} className={activePage === 'explore' ? 'text-violet-400' : 'text-gray-400'}><ExploreIcon /></button>
                <button onClick={() => navigate('upload')} className={activePage === 'upload' ? 'text-violet-400' : 'text-gray-400'}><CreatePostIcon /></button>
                <button onClick={() => navigate('profile', { username: currentUserProfile.username })} className={activePage === 'profile' ? 'text-violet-400' : 'text-gray-400'}><img src={`https://placehold.co/28x28/A78BFA/FFFFFF?text=${currentUserProfile.username.charAt(0).toUpperCase()}`} className="rounded-full" alt="Profile"/></button>
            </nav>
        </div>
    );
};

// --- POST CARD COMPONENT (MOCKED) ---
const PostCard = ({ post, currentUserProfile, showNotification, navigate, updatePostState }) => {
    const isLiked = post.likes.includes(currentUserProfile.id);

    // Optimized: Comments should be displayed in the order they were stored.
    // FIX APPLIED HERE: Using unary plus (+) to convert Date objects to milliseconds for sorting.
    const sortedComments = post.comments?.slice().sort((a,b) => (+a.createdAt || 0) - (+b.createdAt || 0)) || [];

    const handleLike = async () => {
        // MOCK: Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        const newLikes = isLiked 
            ? post.likes.filter(id => id !== currentUserProfile.id) 
            : [...post.likes, currentUserProfile.id];
            
        updatePostState(post.id, { likes: newLikes });
    };

    const handleShare = () => {
        const postUrl = `${window.location.origin}${window.location.pathname}#post=${post.id}`;
        const tempInput = document.createElement('input');
        tempInput.value = postUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            showNotification("Post link copied to clipboard!");
        } catch (err) {
            showNotification("Failed to copy link.", true);
            console.error('Copy failed:', err);
        } finally {
            document.body.removeChild(tempInput);
        }
    };
    
    const handleComment = async (e) => {
        e.preventDefault();
        const commentText = e.target.elements.comment.value;
        if (!commentText.trim()) return;
        
        // MOCK: Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            const newComment = { 
                userId: currentUserProfile.id, 
                username: currentUserProfile.username, 
                text: commentText.trim(), 
                createdAt: new Date()
            };
            
            updatePostState(post.id, { comments: [...post.comments, newComment] });
            e.target.reset();
        } catch (error) {
            showNotification("Failed to post comment (Mock Error).", true);
            console.error("Comment error:", error);
        }
    };

    return (
        <article className="post-card rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] shadow-lg">
            <header className="p-4 flex items-center space-x-3">
                <img src={`https://placehold.co/40x40/A78BFA/FFFFFF?text=${post.username.charAt(0).toUpperCase()}`} className="rounded-full ring-2 ring-violet-500" alt={`${post.username}'s avatar`}/>
                <button onClick={() => navigate('profile', {username: post.username})} className="font-semibold text-white hover:underline">{post.username}</button>
            </header>
            <div className="w-full aspect-square bg-black flex items-center justify-center">
                 <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover"/>
            </div>
            <div className="p-4">
                <div className="flex items-center space-x-4 mb-2">
                    <button onClick={handleLike} className="p-1 rounded-full hover:bg-gray-800 transition duration-150"><HeartIcon isLiked={isLiked} /></button>
                    <span className="text-white font-semibold">{post.likes.length} Likes</span>
                    <button onClick={handleShare} className="p-1 rounded-full hover:bg-gray-800 transition duration-150"><ShareIcon /></button>
                </div>
                <p className="text-gray-300">
                    <button onClick={() => navigate('profile', {username: post.username})} className="font-bold text-white hover:underline mr-1">{post.username}</button> {post.caption}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {post.tagsArray?.map(tag => <button key={tag} onClick={() => navigate('tag', {tag: tag.substring(1)})} className="text-violet-400 text-sm hover:underline transition duration-150">#{tag.substring(1)}</button>)}
                </div>
                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
                    {sortedComments.map((comment, index) => (
                        <p key={index} className="text-sm text-gray-400">
                            <button onClick={() => navigate('profile', {username: comment.username})} className="font-semibold text-gray-200 hover:underline mr-1">{comment.username}</button> {comment.text}
                        </p>
                    ))}
                </div>
                <form onSubmit={handleComment} className="mt-4 flex gap-2 border-t border-gray-700 pt-3">
                    <input name="comment" type="text" placeholder="Add a comment..." className="w-full bg-transparent focus:outline-none text-sm p-1" required/>
                    <button type="submit" className="text-violet-400 font-semibold text-sm hover:text-violet-300">Post</button>
                </form>
                <p className="text-gray-500 text-xs mt-3">{new Date(post.createdAt).toLocaleString()}</p>
            </div>
        </article>
    );
};

// --- HOME PAGE COMPONENT (MOCKED) ---
const HomePage = ({ currentUserProfile, tag, postId, showNotification, navigate, mockPosts, updatePostState }) => {
    const [isLoading, setIsLoading] = useState(true);
    
    // MOCK: Simulate fetching and filtering logic
    const filteredPosts = mockPosts
        .filter(post => 
            (postId ? post.id === postId : true) &&
            (tag ? post.tagsArray.includes(`#${tag}`) : true) &&
            (!currentUserProfile.blockedUsers.includes(post.userId))
        )
        // Sort by creation date (newest first)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    useEffect(() => {
        // Simulate network delay for fetching feed
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, [tag, postId, mockPosts]);
    
    const ExamplePost = () => (
         <div className="post-card rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] animate-pulse shadow-lg">
            <div className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            </div>
            <div className="w-full aspect-square bg-gray-700"></div>
            <div className="p-4 space-y-3">
                <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded bg-gray-700"></div>
                    <div className="w-6 h-6 rounded bg-gray-700"></div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
        </div>
    );

    return (
        <div className="max-w-xl mx-auto py-6 md:py-10 px-4">
             {tag && <div className="mb-6 p-3 bg-violet-900/50 border border-violet-700 rounded-lg text-center">
                <span className='font-medium'>Showing posts tagged <span className='font-bold'>#{tag}</span></span>
                <button onClick={() => navigate('home')} className="ml-3 text-violet-300 hover:text-white font-bold transition duration-150">Clear Filter</button>
            </div>}

            <h1 className="text-3xl font-extrabold mb-8 text-white">
                {postId ? "Single Post View (Mock)" : (tag ? `Posts about #${tag}` : "Home Feed (Mock)")}
            </h1>

            {isLoading ? <ExamplePost /> : 
                filteredPosts.length > 0 ? (
                    <div className="space-y-8">
                        {filteredPosts.map(post => 
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                currentUserProfile={currentUserProfile} 
                                showNotification={showNotification} 
                                navigate={navigate}
                                updatePostState={updatePostState} // Pass the state updater
                            />
                        )}
                    </div>
                ) : <p className="text-center text-gray-400 p-10">No mock posts found with this filter.</p>
            }
        </div>
    );
};

// --- PROFILE PAGE COMPONENT (MOCKED) ---
const ProfilePage = ({ username, currentUserProfile, setCurrentUserProfile, showNotification, navigate, mockPosts }) => {
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('grid');
    
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            const usernameToFetch = username || currentUserProfile.username;
            
            // MOCK: Simulate fetching the user profile
            const userToFetch = usernameToFetch === currentUserProfile.username 
                ? currentUserProfile 
                : await fetchUserProfileByUsername(null, usernameToFetch); // db is null in concept mode
            
            if (userToFetch) {
                setProfileUser(userToFetch);
                // MOCK: Filter posts for the user
                setUserPosts(mockPosts
                    .filter(post => post.username === userToFetch.username)
                    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
                
                setIsLoading(false);
            } else {
                setProfileUser(null);
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [username, currentUserProfile, mockPosts]);

    const handleFollow = async () => {
        if (!profileUser || profileUser.id === currentUserProfile.id) return;
        
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        
        const isFollowing = currentUserProfile.following?.includes(profileUser.id);
        
        try {
            // MOCK: Update current user's following list
            const updatedFollowing = isFollowing 
                ? currentUserProfile.following.filter(id => id !== profileUser.id) 
                : [...(currentUserProfile.following || []), profileUser.id];
            
            setCurrentUserProfile(prev => ({ ...prev, following: updatedFollowing }));
            
            // MOCK: Update target user's followers list for local display
            const updatedFollowers = isFollowing 
                ? profileUser.followers.filter(id => id !== currentUserProfile.id) 
                : [...(profileUser.followers || []), currentUserProfile.id];
                
            setProfileUser(prev => ({ ...prev, followers: updatedFollowers }));
            
            showNotification(isFollowing ? `Unfollowed ${profileUser.username} (Mock)` : `Following ${profileUser.username}! (Mock)`);
            
        } catch (error) {
            showNotification(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user (Mock Error).`, true);
        }
        setIsLoading(false);
    };

    if (isLoading) return <p className="text-center text-gray-400 p-10">Loading mock profile...</p>;
    if (!profileUser) return <p className="text-center text-red-500 p-10">Mock User not found.</p>;
    
    const isOwnProfile = profileUser.id === currentUserProfile.id;
    const isFollowing = currentUserProfile.following?.includes(profileUser.id);
    const mutuals = currentUserProfile.following?.filter(id => profileUser.followers?.includes(id));
    const isFollower = profileUser.following?.includes(currentUserProfile.id);

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
             {isSettingsOpen && <SettingsModal currentUserProfile={currentUserProfile} setCurrentUserProfile={setCurrentUserProfile} onClose={() => setIsSettingsOpen(false)} showNotification={showNotification} />}
            <header className="flex items-start gap-4 md:gap-8 mb-6">
                <img src={`https://placehold.co/100x100/A78BFA/FFFFFF?text=${profileUser.username.charAt(0).toUpperCase()}`} alt="User Profile" className="rounded-full md:w-36 md:h-36 object-cover ring-4 ring-violet-500"/>
                <div className="w-full">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 mb-2">
                        <h2 className="text-2xl font-light">{profileUser.username}</h2>
                        {isOwnProfile ? (
                            <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-1 text-sm rounded-full bg-gray-800 hover:bg-gray-700 transition duration-150">Edit profile</button>
                        ) : (
                           <div className="flex gap-2">
                             <button onClick={handleFollow} disabled={isLoading} className={`px-4 py-1 text-sm rounded-full font-semibold transition duration-150 disabled:opacity-50 ${isFollowing ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' : 'bg-violet-600 hover:bg-violet-700'}`}>{isLoading ? (isFollowing ? 'Unfollowing...' : 'Following...') : (isFollowing ? 'Following' : 'Follow')}</button>
                             {/* The "Message" button is a placeholder since a chat feature isn't implemented */}
                             <button className="px-4 py-1 text-sm rounded-full bg-gray-700 hover:bg-gray-600 transition duration-150 opacity-50 cursor-not-allowed">Message</button>
                           </div>
                        )}
                    </div>
                     <div className="hidden md:flex items-center gap-8 text-md my-3">
                        <p><span className="font-bold">{userPosts.length}</span> posts</p>
                        <p><span className="font-bold">{profileUser.followers?.length || 0}</span> followers</p>
                        <p><span className="font-bold">{profileUser.following?.length || 0}</span> following</p>
                    </div>
                    <div className="mt-2">
                        <p className="font-bold">{profileUser.username} {profileUser.pronouns && <span className="text-sm font-normal text-gray-500">({profileUser.pronouns})</span>}</p>
                        {profileUser.category && <p className="text-sm text-violet-400 font-semibold">{profileUser.category}</p>}
                        <p className="text-sm mt-1 text-gray-300">{profileUser.bio}</p>
                        {profileUser.links?.length > 0 && profileUser.links.map((link, index) => (
                             <a key={index} href={link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center mt-1">
                                <LinkIcon className='w-4 h-4 mr-1'/> {link}
                             </a>
                        ))}
                    </div>
                </div>
            </header>
            
            {mutuals?.length > 0 && <p className="text-xs text-gray-400 mb-4">Followed by {mutuals.length} mutuals</p>}
            {!isOwnProfile && isFollower && !isFollowing && <p className="text-xs text-violet-300 mb-4 font-medium">{profileUser.username} follows you</p>}


            <div className="flex justify-around items-center border-y border-gray-800 text-center text-sm p-2 md:hidden mb-4">
                <p><span className="font-bold">{userPosts.length}</span><br/>posts</p>
                <p><span className="font-bold">{profileUser.followers?.length || 0}</span><br/>followers</p>
                <p><span className="font-bold">{profileUser.following?.length || 0}</span><br/>following</p>
            </div>

            <div className="flex gap-4 p-4 overflow-x-auto border-b border-gray-800">
                {['Highlights', 'Clips', 'Guides'].map(item => (
                    <div key={item} className="text-center flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center mx-auto text-xl text-violet-400">?</div>
                        <p className="text-xs mt-1">{item}</p>
                    </div>
                ))}
            </div>

            <div className="flex justify-around border-t border-gray-800 mt-4">
                <button onClick={() => setActiveTab('grid')} className={`flex-1 p-3 transition duration-150 ${activeTab === 'grid' ? 'border-t-2 border-white text-white' : 'text-gray-400 hover:text-gray-200'}`}><GridIcon className="mx-auto"/></button>
                <button onClick={() => setActiveTab('tagged')} className={`flex-1 p-3 transition duration-150 ${activeTab === 'tagged' ? 'border-t-2 border-white text-white' : 'text-gray-400 hover:text-gray-200'}`}><TagIcon className="mx-auto"/></button>
            </div>
            
            {activeTab === 'grid' ? (
                userPosts.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1 mt-1">
                        {userPosts.map(post => (
                            <button key={post.id} onClick={() => navigate('post', { postId: post.id })} className="relative group overflow-hidden aspect-square bg-black">
                                <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover transition duration-300 group-hover:opacity-75"/>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition duration-300">
                                    <HeartIcon isLiked={true} className="w-6 h-6 mr-1"/> {post.likes.length}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : <p className="text-center text-gray-400 p-10">No posts yet.</p>
            ) : (
                <p className="text-center text-gray-400 p-10">No posts tagged with your profile yet.</p>
            )}

        </div>
    );
};

// --- UPLOAD PAGE COMPONENT (MOCKED) ---
const UploadPage = ({ currentUserProfile, navigate, showNotification, addMockPost }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                showNotification("Please select an image file.", true);
                setSelectedFile(null);
                setPreviewUrl(null);
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleCancel = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        navigate('home');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            showNotification("Please select an image.", true);
            return;
        }
        setIsLoading(true);
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload delay
        
        const { caption, tags } = e.target.elements;
        const rawTags = tags.value.split(/\s+/).filter(t => t.startsWith('#') && t.length > 1);
        
        try {
            // MOCK: Generate a new mock post
            const newPost = {
                id: `mock-post-${Date.now()}`,
                userId: currentUserProfile.id,
                username: currentUserProfile.username,
                caption: caption.value,
                tags: rawTags.join(' '), 
                tagsArray: rawTags, 
                // Use a generic placeholder for the image
                imageUrl: 'https://placehold.co/600x600/5C2E91/FFFFFF?text=NEW+MOCK+POST',
                likes: [currentUserProfile.id], // Auto-like your own post
                comments: [],
                createdAt: new Date(),
            };
            
            addMockPost(newPost); // Update the global mock posts state
            
            showNotification("Post created successfully! (Mock Data)");
            handleCancel(); 
        } catch (error) {
            showNotification("Failed to create post (Mock Error).", true);
            console.error("Upload error:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-xl mx-auto">
           <h1 className="text-3xl font-bold mb-6 text-white">Create New Post (Mock Mode)</h1>
           <form onSubmit={handleSubmit}>
               <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#2a2a2a] shadow-2xl">
                   <label htmlFor="post-image-upload" className="block cursor-pointer">
                        <div className="w-full h-64 object-cover rounded-lg bg-black border-2 border-dashed border-gray-600 flex items-center justify-center mb-4 transition duration-300 hover:border-violet-500">
                            {previewUrl ? 
                                <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover rounded-lg"/>
                                :
                                <span className="text-gray-500">Click to upload image (Only for preview, not uploaded)</span>
                            }
                        </div>
                   </label>
                   <input type="file" id="post-image-upload" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" required/>
                   
                   <textarea name="caption" placeholder="Write a caption..." className="w-full bg-black border border-gray-700 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-[#A78BFA] mb-4 text-white" required></textarea>
                   <input name="tags" type="text" placeholder="Tags, e.g., #Valorant #Apex (use hashtags)" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA] mb-6 text-white"/>
                   
                   <div className="flex gap-4">
                       <button type="button" onClick={handleCancel} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition duration-150">Cancel</button>
                       <button type="submit" disabled={isLoading || !selectedFile} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition duration-150 disabled:bg-gray-500 disabled:cursor-not-allowed">
                           {isLoading ? "Posting..." : "Post to GamerGram"}
                       </button>
                   </div>
               </div>
           </form>
       </div>
    );
};

// --- SETTINGS MODAL COMPONENT (MOCKED) ---
const SettingsModal = ({ currentUserProfile, setCurrentUserProfile, onClose, showNotification }) => {
    const [newUsername, setNewUsername] = useState(currentUserProfile.username);
    const [newBio, setNewBio] = useState(currentUserProfile.bio);
    const [newPronouns, setNewPronouns] = useState(currentUserProfile.pronouns || '');
    const [newCategory, setNewCategory] = useState(currentUserProfile.category || '');
    const [links, setLinks] = useState(currentUserProfile.links || []);
    const [isLoading, setIsLoading] = useState(false);

    const handleLinkChange = (index, value) => {
        const newLinks = [...links];
        newLinks[index] = value;
        setLinks(newLinks.filter(l => l.trim() !== ''));
    };

    const handleAddLink = () => {
        setLinks([...links, '']);
    };
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const newUsernameClean = newUsername.toLowerCase();
        
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        
        if (newUsernameClean !== currentUserProfile.username) {
            if (!/^[a-z0-9_.]+$/.test(newUsernameClean)) {
                showNotification("Username can only contain lowercase letters, numbers, underscores, and periods.", true);
                setIsLoading(false);
                return;
            }
            // MOCK: Simple check if username is one of the hardcoded mock usernames
            if (newUsernameClean === 'apex_legend' || newUsernameClean === 'pro_gamer_x') {
                 showNotification("Username is already taken (Mock).", true);
                 setIsLoading(false);
                 return;
            }
        }
        
        try {
            // MOCK: Update local state immediately
            const dataToUpdate = {
                username: newUsernameClean,
                bio: newBio,
                pronouns: newPronouns,
                category: newCategory,
                links: links.filter(l => l.trim() !== '')
            };

            setCurrentUserProfile(prev => ({...prev, ...dataToUpdate}));
            
            showNotification("Profile updated successfully! (Mock Data)");
            onClose();
        } catch (error) {
            showNotification("Failed to update profile (Mock Error).", true);
            console.error("Profile update error:", error);
        }
        setIsLoading(false);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#2a2a2a] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
                    <h2 className="text-2xl font-bold text-violet-400">Edit Profile (Mock Mode)</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl transition duration-150">&times;</button>
                </div>
                <form onSubmit={handleProfileUpdate}>
                    <div className="space-y-4 mb-6">
                        <InputField label="Username" id="settings-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} type="text" />
                        <InputField label="Category (e.g., Streamer, Artist)" id="settings-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} type="text" />
                        <TextAreaField label="Bio" id="settings-bio" value={newBio} onChange={(e) => setNewBio(e.target.value)} />
                        <InputField label="Pronouns (e.g., He/Him)" id="settings-pronouns" value={newPronouns} onChange={(e) => setNewPronouns(e.target.value)} type="text" />
                        
                        <div className="pt-2">
                             <label className="block text-sm font-medium text-gray-300 mb-2">External Links</label>
                             {links.map((link, index) => (
                                <div key={index} className="flex items-center mb-2">
                                    <input 
                                        type="url" 
                                        placeholder="https://mylink.com"
                                        value={link} 
                                        onChange={(e) => handleLinkChange(index, e.target.value)} 
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setLinks(links.filter((_, i) => i !== index))} 
                                        className="ml-2 text-red-500 hover:text-red-400 text-lg"
                                    >&times;</button>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={handleAddLink} 
                                className="w-full border border-dashed border-violet-500 text-violet-400 py-2 rounded-lg hover:bg-violet-900/30 transition duration-150 mt-2 text-sm"
                            >+ Add Link</button>
                        </div>

                    </div>
                    <div className="flex justify-end pt-4 border-t border-gray-800">
                        <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-full font-semibold bg-violet-600 hover:bg-violet-700 disabled:bg-gray-500 transition duration-150">
                            {isLoading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
             </div>
        </div>
    );
};

// Reusable Input Field Component
const InputField = ({ label, id, value, onChange, type = 'text' }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <input 
            type={type} 
            id={id} 
            value={value} 
            onChange={onChange} 
            className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
        />
    </div>
);

// Reusable Text Area Component
const TextAreaField = ({ label, id, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
        <textarea 
            id={id} 
            value={value} 
            onChange={onChange} 
            className="w-full bg-black border border-gray-700 rounded-lg p-3 h-24 text-white focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"
        ></textarea>
    </div>
);


// --- MAIN APPLICATION COMPONENT ---
export default function App() {
    const [user, setUser] = useState(null); // Mock User State
    const [currentUserProfile, setCurrentUserProfile] = useState(null); // Mock Profile State
    const [page, setPage] = useState(null); 
    const [pageParams, setPageParams] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    
    // MOCK: State to hold posts, simulating the DB collection
    const [mockPosts, setMockPosts] = useState(initialMockPosts);

    // MOCK: Function to update an individual post's state
    const updatePostState = useCallback((postId, updates) => {
        setMockPosts(prevPosts => prevPosts.map(post => 
            post.id === postId ? { ...post, ...updates } : post
        ));
    }, []);

    // MOCK: Function to add a new post
    const addMockPost = useCallback((newPost) => {
         setMockPosts(prevPosts => [newPost, ...prevPosts]);
    }, []);

    // --- Notification Handler ---
    const showNotification = useCallback((message, isError = false) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, isError }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3500);
    }, []);

    // --- Navigation Handler ---
    const navigate = useCallback((targetPage, params = {}) => {
        const paramString = params.username ? `=${params.username}` : (params.tag ? `=${params.tag}` : (params.postId ? `=${params.postId}`: ''));
        window.location.hash = targetPage + paramString;
    }, []);

    // --- 1. MOCK Initialization and Auth Listener ---
    useEffect(() => {
        // MOCK: Simulate initialization delay
        setTimeout(() => {
            // MOCK: If the user is not currently logged in (based on state), render AuthPage
            if (!user) {
                 setIsLoading(false);
                 return;
            }
            
            // MOCK: If user is logged in, set mock profile and navigate
            setCurrentUserProfile(mockCurrentUserProfile);
            
            if (window.location.hash === '' || window.location.hash === '#') {
                navigate('home');
            }
            
            setIsLoading(false);
        }, 1000); // Wait for a second to simulate loading
        
    }, [navigate, user]); // Reruns when user state changes (e.g., after mock login/logout)

    // --- 2. URL Hash Listener (Routing) ---
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1);
            if (!hash && user) {
                navigate('home');
                return;
            }
            const [pageId, param] = hash.split('=');
            let params = {};
            if(param) {
                if (pageId === 'profile') params = { username: param };
                if (pageId === 'tag') params = { tag: param };
                if (pageId === 'post') params = { postId: param };
            }
            setPage(pageId || 'home');
            setPageParams(params);
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); 
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [navigate, user]);

    if (isLoading) {
        return <div className="min-h-screen bg-black flex items-center justify-center text-white text-xl font-medium">Loading GamerGram Concept...</div>;
    }
    
    // Set services to null to prevent accidental usage
    const db = null;
    const auth = null;
    const storage = null;

    // --- Authentication Check (MOCKED) ---
    if (!user || !currentUserProfile) {
        // If not logged in, show the mock AuthPage
        return <AuthPage showNotification={showNotification} setMockUser={setUser} setCurrentUserProfile={setCurrentUserProfile} />;
    }

    // --- Page Renderer ---
    const renderPage = () => {
        if (!page || !currentUserProfile) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Initializing UI...</div>;
        
        // Pass mock data and state setters to components
        switch (page) {
            case 'profile':
                return <ProfilePage username={pageParams.username} currentUserProfile={currentUserProfile} setCurrentUserProfile={setCurrentUserProfile} showNotification={showNotification} navigate={navigate} mockPosts={mockPosts} />;
            case 'upload':
                return <UploadPage currentUserProfile={currentUserProfile} navigate={navigate} showNotification={showNotification} addMockPost={addMockPost} />;
            case 'explore':
                return <div className="p-8"><h1 className="text-3xl font-bold">Explore (Mock)</h1><p className="text-gray-400 mt-4">Discover new creators and content. This page is coming soon!</p></div>;
            default: // home or tag/post filter
                return <HomePage currentUserProfile={currentUserProfile} tag={pageParams.tag} postId={pageParams.postId} showNotification={showNotification} navigate={navigate} mockPosts={mockPosts} updatePostState={updatePostState} />;
        }
    };
    
    return (
        <>
            <style jsx global>{`
                /* Global styles from the original globals.css and tailwind.config.js merged */
                @tailwind base;
                @tailwind components;
                @tailwind utilities;

                body {
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    font-family: 'Inter', sans-serif;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
            <div className="fixed top-5 right-5 z-[100] space-y-2">
                {notifications.map(n => <Notification key={n.id} {...n} />)}
            </div>
            {/* Pass mock setters for logout to the Layout component */}
            <Layout currentUserProfile={currentUserProfile} navigate={navigate} setMockUser={setUser} setCurrentUserProfile={setCurrentUserProfile}>
                {renderPage()}
            </Layout>
        </>
    );
}
