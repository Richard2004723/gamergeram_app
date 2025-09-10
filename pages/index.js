'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signInAnonymously 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    onSnapshot,
    updateDoc,
    arrayUnion,
    arrayRemove,
    writeBatch
} from 'firebase/firestore';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'firebase/storage';

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyB2aJP1_9HA05T-F7ibtUh29XWAHRmCCdg",
    authDomain: "gamergram-9a855.firebaseapp.com",
    projectId: "gamergram-9a855",
    storageBucket: "gamergram-9a855.appspot.com",
    messagingSenderId: "225075637418",
    appId: "1:225075637418:web:9d094d12fd811e21cf74d3",
    measurementId: "G-0Y9L8CHJFQ"
};

const appId = 'gamergram-app';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- HELPER COMPONENTS (ICONS) ---
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const ExploreIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const CreatePostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>;
const HeartIcon = ({ isLiked }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" className={`transition-all duration-200 ${isLiked ? 'fill-red-500 stroke-red-500' : 'fill-transparent stroke-current'}`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>;
const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;


// --- Firebase Utility Functions ---
async function fetchUserProfileByUsername(username) {
    if (!username) return null;
    const usersRef = collection(db, `/artifacts/${appId}/public/data/users`);
    const q = query(usersRef, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
}

// --- NOTIFICATION COMPONENT ---
const Notification = ({ message, isError }) => (
    <div className={`p-4 rounded-lg shadow-lg text-white animate-fade-in ${isError ? 'bg-red-500' : 'bg-green-500'}`}>
        {message}
    </div>
);

// --- AUTHENTICATION PAGE COMPONENT ---
const AuthPage = () => {
    const [authMode, setAuthMode] = useState('signin');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        signInAnonymously(auth).catch(err => console.error("Anonymous sign-in failed:", err));
    }, []);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        const { email, username, password } = e.target.elements;
        const usernameClean = username.value.toLowerCase();

        if (!/^[a-z0-9_.]+$/.test(usernameClean)) {
            setError("Username can only contain lowercase letters, numbers, underscores, and periods.");
            setIsLoading(false);
            return;
        }

        try {
            const usersRef = collection(db, `/artifacts/${appId}/public/data/users`);
            const q = query(usersRef, where("username", "==", usernameClean));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setError("This username is already taken.");
                setIsLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
            const user = userCredential.user;
            await setDoc(doc(db, `/artifacts/${appId}/public/data/users`, user.uid), {
                username: usernameClean, email: user.email, followers: [], following: [],
                bio: 'Welcome to my GamerGram profile!', isBanned: false, createdAt: new Date(),
                links: [], blockedUsers: [], pronouns: '', category: ''
            });
            await signOut(auth);
            setSuccess("Account created! Please log in.");
            setAuthMode('signin');
        } catch (err) {
            setError(err.message);
        }
        setIsLoading(false);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const { email, password } = e.target.elements;
        try {
            await signInWithEmailAndPassword(auth, email.value, password.value);
        } catch (err) {
            setError("Invalid email or password.");
        }
        setIsLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess('');
        const { email } = e.target.elements;
        try {
            await sendPasswordResetEmail(auth, email.value);
            setSuccess("Password reset email sent!");
        } catch (err) {
            setError("Could not send reset email.");
        }
        setIsLoading(false);
    };
    
    return (
        <main className="min-h-screen flex items-center justify-center bg-black p-4 text-white">
            <div className="w-full max-w-sm">
                {authMode === 'signin' && (
                    <div className="p-8 space-y-6 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] animate-fade-in">
                        <h2 className="text-3xl font-bold text-center"><span className="text-[#A78BFA]">Gamer</span>Gram</h2>
                        <form onSubmit={handleSignIn} className="space-y-4">
                            <input name="email" type="email" placeholder="Email" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                            <input name="password" type="password" placeholder="Password" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                            <div className="text-right">
                                <button type="button" onClick={() => setAuthMode('forgot')} className="text-sm font-medium text-violet-400 hover:underline">Forgot Password?</button>
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500">{isLoading ? 'Logging in...' : 'Log In'}</button>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                        </form>
                        <p className="text-center text-sm text-gray-400">Don't have an account? <button onClick={() => { setAuthMode('signup'); setError(''); setSuccess(''); }} className="font-bold text-[#A78BFA] hover:underline cursor-pointer">Sign Up</button></p>
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
                             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        </form>
                        <p className="text-center text-sm text-gray-400">Have an account? <button onClick={() => { setAuthMode('signin'); setError(''); setSuccess(''); }} className="font-bold text-[#A78BFA] hover:underline cursor-pointer">Log In</button></p>
                    </div>
                )}
                {authMode === 'forgot' && (
                     <div className="p-8 space-y-6 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] animate-fade-in">
                        <h2 className="text-3xl font-bold text-center">Reset Password</h2>
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <input name="email" type="email" placeholder="Email" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]" required />
                            <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500">{isLoading ? 'Sending...' : 'Send Reset Link'}</button>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {success && <p className="text-green-500 text-sm text-center">{success}</p>}
                        </form>
                        <p className="text-center text-sm text-gray-400"><button onClick={() => { setAuthMode('signin'); setError(''); setSuccess(''); }} className="font-bold text-[#A78BFA] hover:underline cursor-pointer">Back to Log In</button></p>
                    </div>
                )}
            </div>
        </main>
    );
};


// --- LAYOUT COMPONENT ---
const Layout = ({ currentUserProfile, children, navigate }) => {
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

    const navLinkClasses = (page) => `nav-link text-gray-300 hover:text-white transition duration-200 flex items-center p-2 rounded-lg ${activePage === page ? 'text-violet-400' : ''}`;
    
    return (
        <div className="antialiased text-gray-200 bg-black">
            <aside className="hidden md:flex fixed top-0 left-0 h-full w-60 bg-black border-r border-gray-800 p-6 flex-col z-10">
                 <h1 className="text-2xl font-bold text-white mb-10"><span className="text-[#A78BFA]">Gamer</span>Gram</h1>
                <nav className="flex flex-col space-y-4">
                    <button onClick={() => navigate('home')} className={navLinkClasses('home')}><HomeIcon /><span className="ml-4 text-lg">Home</span></button>
                    <button onClick={() => navigate('explore')} className={navLinkClasses('explore')}><ExploreIcon /><span className="ml-4 text-lg">Explore</span></button>
                    <button onClick={() => navigate('upload')} className={navLinkClasses('upload')}><CreatePostIcon /><span className="ml-4 text-lg">Create Post</span></button>
                    <button onClick={() => navigate('profile', { username: currentUserProfile.username })} className={navLinkClasses('profile')}><ProfileIcon /><span className="ml-4 text-lg">{currentUserProfile.username}</span></button>
                </nav>
                 <div className="mt-auto">
                    <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-white transition duration-200 flex items-center p-2 rounded-lg w-full"><LogoutIcon /><span className="ml-4 text-lg">Log Out</span></button>
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

// --- MAIN APPLICATION ---
const App = () => {
    const [user, setUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [page, setPage] = useState(null); 
    const [pageParams, setPageParams] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);

    const showNotification = (message, isError = false) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, isError }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3500);
    };

    const navigate = useCallback((targetPage, params = {}) => {
        const paramString = params.username ? `=${params.username}` : (params.tag ? `=${params.tag}` : (params.postId ? `=${params.postId}`: ''));
        window.location.hash = targetPage + paramString;
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && !user.isAnonymous) {
                const userDoc = await getDoc(doc(db, `/artifacts/${appId}/public/data/users`, user.uid));
                if (userDoc.exists()) {
                    setUser(user);
                    setCurrentUserProfile({ id: userDoc.id, ...userDoc.data() });
                    if (window.location.hash === '' || window.location.hash === '#') {
                        navigate('home');
                    }
                } else {
                    signOut(auth);
                }
            } else {
                setUser(null);
                setCurrentUserProfile(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [navigate]);

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
        return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading GamerGram...</div>;
    }

    if (!user) {
        return <AuthPage />;
    }

    const renderPage = () => {
        if (!page || !currentUserProfile) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Initializing...</div>;
        switch (page) {
            case 'profile':
                return <ProfilePage username={pageParams.username} currentUserProfile={currentUserProfile} setCurrentUserProfile={setCurrentUserProfile} showNotification={showNotification} navigate={navigate} />;
            case 'upload':
                return <UploadPage currentUserProfile={currentUserProfile} navigate={navigate} showNotification={showNotification} />;
            case 'explore':
                return <div className="p-8"><h1 className="text-3xl font-bold">Explore</h1><p className="text-gray-400 mt-4">Discover new creators and content. Coming soon!</p></div>;
            default:
                return <HomePage currentUserProfile={currentUserProfile} tag={pageParams.tag} postId={pageParams.postId} showNotification={showNotification} navigate={navigate} />;
        }
    };
    
    return (
        <>
            <div className="fixed top-5 right-5 z-[100] space-y-2">
                {notifications.map(n => <Notification key={n.id} {...n} />)}
            </div>
            <Layout currentUserProfile={currentUserProfile} navigate={navigate}>
                {renderPage()}
            </Layout>
        </>
    );
}

export default App;

// --- SUB-PAGES & COMPONENTS ---

const PostCard = ({ post, currentUserProfile, showNotification, navigate }) => {
    const isLiked = post.likes.includes(currentUserProfile.id);

    const handleLike = async () => {
        const postRef = doc(db, `/artifacts/${appId}/public/data/posts`, post.id);
        await updateDoc(postRef, { likes: isLiked ? arrayRemove(currentUserProfile.id) : arrayUnion(currentUserProfile.id) });
    };

    const handleShare = () => {
        const postUrl = `${window.location.origin}${window.location.pathname}#post=${post.id}`;
        navigator.clipboard.writeText(postUrl)
            .then(() => showNotification("Post link copied to clipboard!"))
            .catch(() => showNotification("Failed to copy link.", true));
    };
    
    const handleComment = async (e) => {
        e.preventDefault();
        const commentText = e.target.elements.comment.value;
        if (!commentText.trim()) return;
        const postRef = doc(db, `/artifacts/${appId}/public/data/posts`, post.id);
        await updateDoc(postRef, {
            comments: arrayUnion({ userId: currentUserProfile.id, username: currentUserProfile.username, text: commentText, createdAt: new Date() })
        });
        e.target.reset();
    };

    return (
        <article className="post-card rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]">
            <header className="p-4 flex items-center space-x-3">
                <img src={`https://placehold.co/40x40/A78BFA/FFFFFF?text=${post.username.charAt(0).toUpperCase()}`} className="rounded-full" alt={`${post.username}'s avatar`}/>
                <button onClick={() => navigate('profile', {username: post.username})} className="font-semibold text-white hover:underline">{post.username}</button>
            </header>
            <img src={post.imageUrl} alt="Post content" className="w-full bg-black"/>
            <div className="p-4">
                <div className="flex items-center space-x-4">
                    <button onClick={handleLike}><HeartIcon isLiked={isLiked} /></button>
                    <span className="text-white font-semibold">{post.likes.length}</span>
                    <button onClick={handleShare}><ShareIcon /></button>
                </div>
                <p className="text-gray-300 mt-2">
                    <button onClick={() => navigate('profile', {username: post.username})} className="font-semibold text-white hover:underline">{post.username}</button> {post.caption}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                    {post.tagsArray?.map(tag => <button key={tag} onClick={() => navigate('tag', {tag: tag.substring(1)})} className="text-violet-400 text-sm hover:underline">{tag}</button>)}
                </div>
                <div className="mt-3 space-y-2">
                    {post.comments?.sort((a,b) => a.createdAt.toDate() - b.createdAt.toDate()).map((comment, index) => (
                        <p key={index} className="text-sm text-gray-400">
                            <button onClick={() => navigate('profile', {username: comment.username})} className="font-semibold text-gray-200 hover:underline">{comment.username}</button> {comment.text}
                        </p>
                    ))}
                </div>
                <form onSubmit={handleComment} className="mt-3 flex gap-2">
                    <input name="comment" type="text" placeholder="Add a comment..." className="w-full bg-black border-b border-gray-700 focus:outline-none focus:border-violet-500 text-sm" required/>
                    <button type="submit" className="text-violet-400 font-semibold text-sm">Post</button>
                </form>
                <p className="text-gray-500 text-xs mt-3">{new Date(post.createdAt?.toDate()).toLocaleString()}</p>
            </div>
        </article>
    );
};


const HomePage = ({ currentUserProfile, tag, postId, showNotification, navigate }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let q;
        if (postId) {
             q = query(collection(db, `/artifacts/${appId}/public/data/posts`), where("__name__", "==", postId));
        } else if (tag) {
            q = query(collection(db, `/artifacts/${appId}/public/data/posts`), where("tagsArray", "array-contains", `#${tag}`));
        } else {
            q = query(collection(db, `/artifacts/${appId}/public/data/posts`));
        }

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            setIsLoading(true);
            const blockedUsers = currentUserProfile?.blockedUsers || [];
            const postPromises = snapshot.docs
                .filter(doc => !blockedUsers.includes(doc.data().userId))
                .map(async postDoc => {
                    const post = { id: postDoc.id, ...postDoc.data() };
                    const userSnap = await getDoc(doc(db, `/artifacts/${appId}/public/data/users`, post.userId));
                    return (userSnap.exists() && !userSnap.data().isBanned) ? post : null;
                });

            const fetchedPosts = (await Promise.all(postPromises)).filter(Boolean);
            setPosts(fetchedPosts.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()));
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [tag, postId, currentUserProfile]);
    
    const ExamplePost = () => (
         <div className="post-card rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] animate-pulse">
            <div className="p-4 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-700"></div>
                <div className="h-4 bg-gray-700 rounded w-1/4"></div>
            </div>
            <div className="w-full h-64 bg-gray-700"></div>
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
        <div className="max-w-xl mx-auto py-10 px-4">
             {tag && <div className="mb-4 p-3 bg-violet-900/50 border border-violet-700 rounded-lg text-center">
                <span>Showing posts tagged #{tag}</span>
                <button onClick={() => navigate('home')} className="ml-2 text-violet-300 hover:text-white font-bold">&times; Clear</button>
            </div>}
            {isLoading ? <ExamplePost /> : 
                posts.length > 0 ? (
                    <div className="space-y-8">
                        {posts.map(post => <PostCard key={post.id} post={post} currentUserProfile={currentUserProfile} showNotification={showNotification} navigate={navigate}/>)}
                    </div>
                ) : <p className="text-center text-gray-400">No posts found. Be the first to post!</p>
            }
        </div>
    );
};

const ProfilePage = ({ username, currentUserProfile, setCurrentUserProfile, showNotification, navigate }) => {
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('grid');
    
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            const usernameToFetch = username || currentUserProfile.username;
            if (!usernameToFetch) {
                setProfileUser(null);
                setIsLoading(false);
                return;
            }

            const userToFetch = usernameToFetch === currentUserProfile.username 
                ? currentUserProfile 
                : await fetchUserProfileByUsername(usernameToFetch);
            
            if (userToFetch) {
                setProfileUser(userToFetch);
                const postsQuery = query(collection(db, `/artifacts/${appId}/public/data/posts`), where("userId", "==", userToFetch.id));
                const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
                    setUserPosts(snapshot.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate()));
                });
                setIsLoading(false);
                return unsubscribe;
            } else {
                setProfileUser(null);
                setIsLoading(false);
            }
        };
        const unsubPromise = fetchProfile();
        return () => {
            unsubPromise.then(unsub => {
                if (unsub && typeof unsub === 'function') {
                    unsub();
                }
            });
        };
    }, [username, currentUserProfile]);

    const handleFollow = async () => {
        const batch = writeBatch(db);
        const currentUserRef = doc(db, `/artifacts/${appId}/public/data/users`, currentUserProfile.id);
        const targetUserRef = doc(db, `/artifacts/${appId}/public/data/users`, profileUser.id);
        const isFollowing = currentUserProfile.following?.includes(profileUser.id);
        if(isFollowing){
            batch.update(currentUserRef, { following: arrayRemove(profileUser.id) });
            batch.update(targetUserRef, { followers: arrayRemove(currentUserProfile.id) });
        } else {
            batch.update(currentUserRef, { following: arrayUnion(profileUser.id) });
            batch.update(targetUserRef, { followers: arrayUnion(currentUserProfile.id) });
        }
        await batch.commit();
        const updatedProfile = await getDoc(targetUserRef);
        setProfileUser({id: updatedProfile.id, ...updatedProfile.data()});
        const updatedCurrentUserProfile = await getDoc(currentUserRef);
        setCurrentUserProfile({id: updatedCurrentUserProfile.id, ...updatedCurrentUserProfile.data()});
    };

    if (isLoading) return <p className="text-center text-gray-400 p-10">Loading profile...</p>;
    if (!profileUser) return <p className="text-center text-red-500 p-10">User not found.</p>;
    
    const isOwnProfile = profileUser.id === currentUserProfile.id;
    const isFollowing = currentUserProfile.following?.includes(profileUser.id);
    const mutuals = currentUserProfile.following?.filter(id => profileUser.followers?.includes(id));

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
             {isSettingsOpen && <SettingsModal currentUserProfile={currentUserProfile} setCurrentUserProfile={setCurrentUserProfile} onClose={() => setIsSettingsOpen(false)} showNotification={showNotification} />}
            <header className="flex items-start gap-4 md:gap-8 mb-6">
                <img src={`https://placehold.co/80x80/A78BFA/FFFFFF?text=${profileUser.username.charAt(0).toUpperCase()}`} alt="User Profile" className="rounded-full md:w-36 md:h-36"/>
                <div className="w-full">
                    <div className="flex items-center gap-4 mb-2">
                        <h2 className="text-2xl font-light">{profileUser.username}</h2>
                        {isOwnProfile ? (
                            <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-1 text-sm rounded-lg bg-gray-800 hover:bg-gray-700">Edit profile</button>
                        ) : (
                           <div className="flex gap-2">
                             <button onClick={handleFollow} className={`px-4 py-1 text-sm rounded-lg ${isFollowing ? 'bg-gray-700 hover:bg-gray-600' : 'bg-violet-600 hover:bg-violet-700'}`}>{isFollowing ? 'Following' : 'Follow'}</button>
                             <button className="px-4 py-1 text-sm rounded-lg bg-gray-700 hover:bg-gray-600">Message</button>
                           </div>
                        )}
                    </div>
                     <div className="hidden md:flex items-center gap-8 text-md">
                        <p><span className="font-bold">{userPosts.length}</span> posts</p>
                        <p><span className="font-bold">{profileUser.followers?.length || 0}</span> followers</p>
                        <p><span className="font-bold">{profileUser.following?.length || 0}</span> following</p>
                    </div>
                    <div className="mt-2">
                        <p className="font-bold">{profileUser.username}</p>
                        {profileUser.category && <p className="text-sm text-gray-400">{profileUser.category}</p>}
                        <p className="text-sm">{profileUser.bio}</p>
                        {profileUser.pronouns && <p className="text-xs text-gray-500">{profileUser.pronouns}</p>}
                    </div>
                </div>
            </header>
            
            {mutuals?.length > 0 && <p className="text-xs text-gray-400 mb-4">Followed by {mutuals.length} mutuals</p>}

            <div className="flex justify-around items-center border-y border-gray-800 text-center text-sm p-2 md:hidden">
                <p><span className="font-bold">{userPosts.length}</span><br/>posts</p>
                <p><span className="font-bold">{profileUser.followers?.length || 0}</span><br/>followers</p>
                <p><span className="font-bold">{profileUser.following?.length || 0}</span><br/>following</p>
            </div>

            <div className="flex gap-4 p-4">
                {['Shop', 'Reels', 'Guides'].map(item => (
                    <div key={item} className="text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-700 mx-auto"></div>
                        <p className="text-xs mt-1">{item}</p>
                    </div>
                ))}
            </div>

            <div className="flex justify-around border-t border-gray-800">
                <button onClick={() => setActiveTab('grid')} className={`flex-1 p-3 ${activeTab === 'grid' ? 'border-b-2 border-white' : ''}`}><GridIcon className="mx-auto"/></button>
                <button onClick={() => setActiveTab('tagged')} className={`flex-1 p-3 ${activeTab === 'tagged' ? 'border-b-2 border-white' : ''}`}><TagIcon className="mx-auto"/></button>
            </div>
            
            {activeTab === 'grid' ? (
                <div className="grid grid-cols-3 gap-1 mt-1">
                    {userPosts.map(post => <img key={post.id} src={post.imageUrl} className="w-full h-full object-cover aspect-square bg-black"/>)}
                </div>
            ) : (
                <p className="text-center text-gray-400 p-10">No tagged posts yet.</p>
            )}

        </div>
    );
};


const UploadPage = ({ currentUserProfile, navigate, showNotification }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleCancel = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        navigate('home');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) {
            showNotification("Please select an image.", true);
            return;
        }
        setIsLoading(true);
        
        const { caption, tags } = e.target.elements;
        const tagsArray = tags.value.split(' ').filter(t => t.startsWith('#'));
        
        try {
            const storageRef = ref(storage, `posts/${currentUserProfile.id}/${Date.now()}_${selectedFile.name}`);
            await uploadBytes(storageRef, selectedFile);
            const downloadURL = await getDownloadURL(storageRef);
            
            await addDoc(collection(db, `/artifacts/${appId}/public/data/posts`), {
                userId: currentUserProfile.id,
                username: currentUserProfile.username,
                caption: caption.value,
                tags: tags.value,
                tagsArray,
                imageUrl: downloadURL,
                likes: [],
                comments: [],
                createdAt: new Date(),
            });
            
            showNotification("Post created successfully!");
            navigate('home');
        } catch (error) {
            showNotification("Failed to create post.", true);
            console.error("Upload error:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-xl mx-auto">
           <h1 className="text-3xl font-bold mb-6">Create Post</h1>
           <form onSubmit={handleSubmit}>
               <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#2a2a2a]">
                   <label htmlFor="post-image-upload" className="cursor-pointer">
                       <img src={previewUrl || "https://placehold.co/600x400/1a1a1a/4a5568?text=Click+to+upload+image"} alt="Upload preview" className="w-full h-64 object-cover rounded-lg bg-black border-2 border-dashed border-gray-600 flex items-center justify-center mb-4"/>
                   </label>
                   <input type="file" id="post-image-upload" onChange={handleFileChange} className="hidden" accept="image/*"/>
                   <textarea name="caption" placeholder="Write a caption..." className="w-full bg-black border border-gray-700 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-[#A78BFA] mb-4" required></textarea>
                   <input name="tags" type="text" placeholder="Tags, e.g., #Valorant #Apex" className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA] mb-4"/>
                   <div className="flex gap-4">
                       <button type="button" onClick={handleCancel} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition">Cancel</button>
                       <button type="submit" disabled={isLoading} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition disabled:bg-gray-500">{isLoading ? "Posting..." : "Post"}</button>
                   </div>
               </div>
           </form>
       </div>
    );
};

const SettingsModal = ({ currentUserProfile, setCurrentUserProfile, onClose, showNotification }) => {
    const [newUsername, setNewUsername] = useState(currentUserProfile.username);
    const [newBio, setNewBio] = useState(currentUserProfile.bio);
    const [newPronouns, setNewPronouns] = useState(currentUserProfile.pronouns || '');
    const [newCategory, setNewCategory] = useState(currentUserProfile.category || '');
    const [isLoading, setIsLoading] = useState(false);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (newUsername !== currentUserProfile.username) {
            const existingUser = await fetchUserProfileByUsername(newUsername);
            if (existingUser) {
                showNotification("Username is already taken.", true);
                setIsLoading(false);
                return;
            }
        }
        
        try {
            const userRef = doc(db, `/artifacts/${appId}/public/data/users`, currentUserProfile.id);
            await updateDoc(userRef, {
                username: newUsername,
                bio: newBio,
                pronouns: newPronouns,
                category: newCategory
            });
            setCurrentUserProfile(prev => ({...prev, username: newUsername, bio: newBio, pronouns: newPronouns, category: newCategory}));
            showNotification("Profile updated successfully!");
            onClose();
        } catch (error) {
            showNotification("Failed to update profile.", true);
            console.error("Profile update error:", error);
        }
        setIsLoading(false);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
             <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#2a2a2a] w-full max-w-md max-h-[90vh] overflow-y-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                </div>
                 <h3 className="text-lg font-semibold text-violet-400 border-b border-gray-700 pb-2 mb-4">Profile</h3>
                <form onSubmit={handleProfileUpdate}>
                    <div className="mb-4">
                        <label htmlFor="settings-username" className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                        <input type="text" id="settings-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"/>
                    </div>
                     <div className="mb-4">
                        <label htmlFor="settings-category" className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                        <input type="text" id="settings-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"/>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="settings-bio" className="block text-sm font-medium text-gray-300 mb-1">Bio</label>
                        <textarea id="settings-bio" value={newBio} onChange={(e) => setNewBio(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg p-3 h-24 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"></textarea>
                    </div>
                    <div className="mb-4">
                        <label htmlFor="settings-pronouns" className="block text-sm font-medium text-gray-300 mb-1">Pronouns</label>
                        <input type="text" id="settings-pronouns" value={newPronouns} onChange={(e) => setNewPronouns(e.target.value)} className="w-full bg-black border border-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#A78BFA]"/>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:bg-gray-500">{isLoading ? "Saving..." : "Save Profile"}</button>
                    </div>
                </form>
             </div>
        </div>
    );
};

