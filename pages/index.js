import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signInAnonymously,
    signInWithCustomToken
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
    writeBatch,
    addDoc,
    setLogLevel
} from 'firebase/firestore';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL 
} from 'firebase/storage';

// --- Global Variables (Mandatory for Canvas Environment) ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Set Firestore log level for debugging purposes
setLogLevel('Debug');


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
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;


// --- Firebase Utility Functions (Encapsulated) ---

// This function now takes the db instance
const fetchUserProfileByUsername = async (db, username) => {
    if (!db || !username) return null;
    const usersRef = collection(db, `/artifacts/${appId}/public/data/users`);
    const q = query(usersRef, where("username", "==", username));
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            return { id: userDoc.id, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching user profile by username:", error);
        return null;
    }
};

// --- NOTIFICATION COMPONENT ---
const Notification = ({ message, isError }) => (
    <div className={`p-4 rounded-lg shadow-lg text-white animate-fade-in ${isError ? 'bg-red-500' : 'bg-green-500'}`}>
        {message}
    </div>
);

// --- AUTHENTICATION PAGE COMPONENT ---
const AuthPage = ({ db, auth, showNotification }) => {
    const [authMode, setAuthMode] = useState('signin');
    const [isLoading, setIsLoading] = useState(false);

    // Initial anonymous sign-in or custom token sign-in
    useEffect(() => {
        const attemptSignIn = async () => {
            if (!auth) return;
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (err) {
                console.error("Initial sign-in failed:", err);
            }
        };
        attemptSignIn();
    }, [auth]);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { email, username, password } = e.target.elements;
        const usernameClean = username.value.toLowerCase();

        if (!/^[a-z0-9_.]+$/.test(usernameClean)) {
            showNotification("Username can only contain lowercase letters, numbers, underscores, and periods.", true);
            setIsLoading(false);
            return;
        }

        try {
            const existingUser = await fetchUserProfileByUsername(db, usernameClean);
            if (existingUser) {
                showNotification("This username is already taken.", true);
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
            showNotification("Account created! Please log in.");
            setAuthMode('signin');
        } catch (err) {
            showNotification(err.message, true);
        }
        setIsLoading(false);
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { email, password } = e.target.elements;
        try {
            await signInWithEmailAndPassword(auth, email.value, password.value);
        } catch (err) {
            showNotification("Invalid email or password.", true);
        }
        setIsLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const { email } = e.target.elements;
        try {
            await sendPasswordResetEmail(auth, email.value);
            showNotification("Password reset email sent!");
        } catch (err) {
            showNotification("Could not send reset email.", true);
        }
        setIsLoading(false);
    };
    
    const handleSetAuthMode = (mode) => {
        setAuthMode(mode);
        // Clear notifications related to previous auth attempts when switching modes
        // showNotification("", false, true); // (Placeholder for a clear notification function if needed)
    }

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
const Layout = ({ currentUserProfile, children, navigate, auth }) => {
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

    const navLinkClasses = (page) => `nav-link text-gray-300 hover:text-white transition duration-200 flex items-center p-2 rounded-lg ${activePage === page ? 'text-violet-400 bg-gray-900' : ''}`;
    
    return (
        <div className="antialiased text-gray-200 bg-black min-h-screen">
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

// --- POST CARD COMPONENT ---
const PostCard = ({ db, post, currentUserProfile, showNotification, navigate }) => {
    const isLiked = post.likes.includes(currentUserProfile.id);
    const postRef = doc(db, `/artifacts/${appId}/public/data/posts`, post.id);

    // Optimized: Comments should be displayed in the order they were stored.
    // If the post object stores comments in order, we don't need to re-sort every render.
    // Assuming Firebase's arrayUnion preserves insertion order (though Firestore doesn't guarantee array order, 
    // we rely on the saved array order for display simplicity here, or we'd move comments to a sub-collection).
    const sortedComments = post.comments?.slice().sort((a,b) => (a.createdAt?.toDate() || 0) - (b.createdAt?.toDate() || 0)) || [];

    const handleLike = async () => {
        try {
            await updateDoc(postRef, { 
                likes: isLiked ? arrayRemove(currentUserProfile.id) : arrayUnion(currentUserProfile.id) 
            });
        } catch (error) {
            showNotification("Failed to update like status.", true);
            console.error("Like error:", error);
        }
    };

    const handleShare = () => {
        const postUrl = `${window.location.origin}${window.location.pathname}#post=${post.id}`;
        // Using document.execCommand('copy') as navigator.clipboard.writeText() may fail in iframes
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
        
        try {
            await updateDoc(postRef, {
                comments: arrayUnion({ 
                    userId: currentUserProfile.id, 
                    username: currentUserProfile.username, 
                    text: commentText.trim(), 
                    // Storing ServerTimestamp/Date for robust sorting
                    createdAt: new Date()
                })
            });
            e.target.reset();
        } catch (error) {
            showNotification("Failed to post comment.", true);
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
                <p className="text-gray-500 text-xs mt-3">{new Date(post.createdAt?.toDate()).toLocaleString()}</p>
            </div>
        </article>
    );
};

// --- HOME PAGE COMPONENT ---
const HomePage = ({ db, currentUserProfile, tag, postId, showNotification, navigate }) => {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!db || !currentUserProfile) return;
        
        let q;
        const postsRef = collection(db, `/artifacts/${appId}/public/data/posts`);

        if (postId) {
             q = query(postsRef, where("__name__", "==", postId));
        } else if (tag) {
            q = query(postsRef, where("tagsArray", "array-contains", `#${tag}`));
        } else {
            // Fetch all posts for a general feed
            q = query(postsRef);
        }
        
        // This is a simplified query; in a real app, you'd limit the results and use orderBy on a timestamp.

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            setIsLoading(true);
            const blockedUsers = currentUserProfile?.blockedUsers || [];
            
            // Filter out posts from blocked or banned users client-side for simplicity
            const postPromises = snapshot.docs
                .filter(doc => !blockedUsers.includes(doc.data().userId))
                .map(async postDoc => {
                    const post = { id: postDoc.id, ...postDoc.data() };
                    
                    // Optimization: In a production app, user data would be cached/denormalized.
                    // Fetching profile for every post is inefficient.
                    const userSnap = await getDoc(doc(db, `/artifacts/${appId}/public/data/users`, post.userId));
                    
                    return (userSnap.exists() && !userSnap.data().isBanned) ? post : null;
                });

            const fetchedPosts = (await Promise.all(postPromises)).filter(Boolean);
            
            // Sort by creation date (newest first) client-side to avoid index requirement
            setPosts(fetchedPosts.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)));
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching posts:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, tag, postId, currentUserProfile]);
    
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
                {postId ? "Single Post View" : (tag ? `Posts about #${tag}` : "Home Feed")}
            </h1>

            {isLoading ? <ExamplePost /> : 
                posts.length > 0 ? (
                    <div className="space-y-8">
                        {posts.map(post => <PostCard key={post.id} db={db} post={post} currentUserProfile={currentUserProfile} showNotification={showNotification} navigate={navigate}/>)}
                    </div>
                ) : <p className="text-center text-gray-400 p-10">No posts found. Start following people or create a new post!</p>
            }
        </div>
    );
};

// --- PROFILE PAGE COMPONENT ---
const ProfilePage = ({ db, username, currentUserProfile, setCurrentUserProfile, showNotification, navigate }) => {
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('grid');
    
    useEffect(() => {
        let unsubscribePosts = () => {};
        
        const fetchProfile = async () => {
            setIsLoading(true);
            const usernameToFetch = username || currentUserProfile.username;
            if (!usernameToFetch || !db) {
                setProfileUser(null);
                setIsLoading(false);
                return;
            }

            const userToFetch = usernameToFetch === currentUserProfile.username 
                ? currentUserProfile 
                : await fetchUserProfileByUsername(db, usernameToFetch);
            
            if (userToFetch) {
                setProfileUser(userToFetch);
                
                // Setup post listener
                const postsQuery = query(collection(db, `/artifacts/${appId}/public/data/posts`), where("userId", "==", userToFetch.id));
                unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
                    // Sort by creation date (newest first) client-side
                    setUserPosts(snapshot.docs.map(d => ({id: d.id, ...d.data()})).sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0)));
                }, (error) => console.error("Error fetching user posts:", error));
                
                setIsLoading(false);
            } else {
                setProfileUser(null);
                setIsLoading(false);
            }
        };
        fetchProfile();
        return () => { unsubscribePosts(); };
    }, [db, username, currentUserProfile]);

    const handleFollow = async () => {
        if (!db || !profileUser || !currentUserProfile || profileUser.id === currentUserProfile.id) return;
        
        const batch = writeBatch(db);
        const currentUserRef = doc(db, `/artifacts/${appId}/public/data/users`, currentUserProfile.id);
        const targetUserRef = doc(db, `/artifacts/${appId}/public/data/users`, profileUser.id);
        const isFollowing = currentUserProfile.following?.includes(profileUser.id);
        
        try {
            if(isFollowing){
                batch.update(currentUserRef, { following: arrayRemove(profileUser.id) });
                batch.update(targetUserRef, { followers: arrayRemove(currentUserProfile.id) });
            } else {
                batch.update(currentUserRef, { following: arrayUnion(profileUser.id) });
                batch.update(targetUserRef, { followers: arrayUnion(currentUserProfile.id) });
            }
            await batch.commit();
            
            // Manually update local state for immediate feedback
            const updatedFollowers = isFollowing 
                ? profileUser.followers.filter(id => id !== currentUserProfile.id) 
                : [...(profileUser.followers || []), currentUserProfile.id];
                
            setProfileUser(prev => ({ ...prev, followers: updatedFollowers }));
            
            // Fetch updated current user profile to refresh the global state (including following list)
            const updatedCurrentUserProfile = await getDoc(currentUserRef);
            setCurrentUserProfile({id: updatedCurrentUserProfile.id, ...updatedCurrentUserProfile.data()});
            
            showNotification(isFollowing ? `Unfollowed ${profileUser.username}` : `Following ${profileUser.username}!`);
            
        } catch (error) {
            showNotification(`Failed to ${isFollowing ? 'unfollow' : 'follow'} user.`, true);
            console.error("Follow transaction failed:", error);
        }
    };

    if (isLoading) return <p className="text-center text-gray-400 p-10">Loading profile...</p>;
    if (!profileUser) return <p className="text-center text-red-500 p-10">User not found.</p>;
    
    const isOwnProfile = profileUser.id === currentUserProfile.id;
    const isFollowing = currentUserProfile.following?.includes(profileUser.id);
    const mutuals = currentUserProfile.following?.filter(id => profileUser.followers?.includes(id));
    const isFollower = profileUser.following?.includes(currentUserProfile.id);

    return (
        <div className="max-w-4xl mx-auto py-6 px-4">
             {isSettingsOpen && <SettingsModal db={db} currentUserProfile={currentUserProfile} setCurrentUserProfile={setCurrentUserProfile} onClose={() => setIsSettingsOpen(false)} showNotification={showNotification} />}
            <header className="flex items-start gap-4 md:gap-8 mb-6">
                <img src={`https://placehold.co/100x100/A78BFA/FFFFFF?text=${profileUser.username.charAt(0).toUpperCase()}`} alt="User Profile" className="rounded-full md:w-36 md:h-36 object-cover ring-4 ring-violet-500"/>
                <div className="w-full">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 mb-2">
                        <h2 className="text-2xl font-light">{profileUser.username}</h2>
                        {isOwnProfile ? (
                            <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-1 text-sm rounded-full bg-gray-800 hover:bg-gray-700 transition duration-150">Edit profile</button>
                        ) : (
                           <div className="flex gap-2">
                             <button onClick={handleFollow} className={`px-4 py-1 text-sm rounded-full font-semibold transition duration-150 ${isFollowing ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600' : 'bg-violet-600 hover:bg-violet-700'}`}>{isFollowing ? 'Following' : 'Follow'}</button>
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
                        {/* Display Links if they exist */}
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

            {/* This section is commonly used for highlights/stories, keeping original structure */}
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

// --- UPLOAD PAGE COMPONENT ---
const UploadPage = ({ db, storage, currentUserProfile, navigate, showNotification }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Basic validation
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
        if (!selectedFile || !db || !storage) {
            showNotification("Please select an image and ensure services are ready.", true);
            return;
        }
        setIsLoading(true);
        
        const { caption, tags } = e.target.elements;
        // Ensure tags are cleaned and only contain actual tag strings
        const rawTags = tags.value.split(/\s+/).filter(t => t.startsWith('#') && t.length > 1);
        
        try {
            // 1. Upload Image to Storage
            const storageRef = ref(storage, `posts/${currentUserProfile.id}/${Date.now()}_${selectedFile.name}`);
            await uploadBytes(storageRef, selectedFile);
            const downloadURL = await getDownloadURL(storageRef);
            
            // 2. Save Post Document to Firestore
            await addDoc(collection(db, `/artifacts/${appId}/public/data/posts`), {
                userId: currentUserProfile.id,
                username: currentUserProfile.username,
                caption: caption.value,
                tags: rawTags.join(' '), // Store as a single string too (optional, but keeps original field)
                tagsArray: rawTags, // Store as an array for query efficiency (important!)
                imageUrl: downloadURL,
                likes: [],
                comments: [],
                createdAt: new Date(),
            });
            
            showNotification("Post created successfully!");
            handleCancel(); // Reset form and navigate home
        } catch (error) {
            showNotification("Failed to create post. Check console for details.", true);
            console.error("Upload error:", error);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-4 md:p-8 max-w-xl mx-auto">
           <h1 className="text-3xl font-bold mb-6 text-white">Create New Post</h1>
           <form onSubmit={handleSubmit}>
               <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#2a2a2a] shadow-2xl">
                   <label htmlFor="post-image-upload" className="block cursor-pointer">
                        <div className="w-full h-64 object-cover rounded-lg bg-black border-2 border-dashed border-gray-600 flex items-center justify-center mb-4 transition duration-300 hover:border-violet-500">
                            {previewUrl ? 
                                <img src={previewUrl} alt="Upload preview" className="w-full h-full object-cover rounded-lg"/>
                                :
                                <span className="text-gray-500">Click to upload image</span>
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

// --- SETTINGS MODAL COMPONENT ---
const SettingsModal = ({ db, currentUserProfile, setCurrentUserProfile, onClose, showNotification }) => {
    const [newUsername, setNewUsername] = useState(currentUserProfile.username);
    const [newBio, setNewBio] = useState(currentUserProfile.bio);
    const [newPronouns, setNewPronouns] = useState(currentUserProfile.pronouns || '');
    const [newCategory, setNewCategory] = useState(currentUserProfile.category || '');
    const [links, setLinks] = useState(currentUserProfile.links || []); // New state for links
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
        
        if (newUsernameClean !== currentUserProfile.username) {
            if (!/^[a-z0-9_.]+$/.test(newUsernameClean)) {
                showNotification("Username can only contain lowercase letters, numbers, underscores, and periods.", true);
                setIsLoading(false);
                return;
            }
            const existingUser = await fetchUserProfileByUsername(db, newUsernameClean);
            if (existingUser && existingUser.id !== currentUserProfile.id) {
                showNotification("Username is already taken.", true);
                setIsLoading(false);
                return;
            }
        }
        
        try {
            const userRef = doc(db, `/artifacts/${appId}/public/data/users`, currentUserProfile.id);
            const dataToUpdate = {
                username: newUsernameClean,
                bio: newBio,
                pronouns: newPronouns,
                category: newCategory,
                links: links.filter(l => l.trim() !== '') // Filter empty links before saving
            };

            await updateDoc(userRef, dataToUpdate);
            
            // Update local state and propagate up
            setCurrentUserProfile(prev => ({...prev, ...dataToUpdate}));
            
            showNotification("Profile updated successfully!");
            onClose();
        } catch (error) {
            showNotification("Failed to update profile.", true);
            console.error("Profile update error:", error);
        }
        setIsLoading(false);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
             <div className="bg-[#1a1a1a] p-8 rounded-xl border border-[#2a2a2a] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
                 <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-3">
                    <h2 className="text-2xl font-bold text-violet-400">Edit Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl transition duration-150">&times;</button>
                </div>
                <form onSubmit={handleProfileUpdate}>
                    <div className="space-y-4 mb-6">
                        <InputField label="Username" id="settings-username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} type="text" />
                        <InputField label="Category (e.g., Streamer, Artist)" id="settings-category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} type="text" />
                        <TextAreaField label="Bio" id="settings-bio" value={newBio} onChange={(e) => setNewBio(e.target.value)} />
                        <InputField label="Pronouns (e.g., He/Him)" id="settings-pronouns" value={newPronouns} onChange={(e) => setNewPronouns(e.target.value)} type="text" />
                        
                        {/* Links Section */}
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
    const [user, setUser] = useState(null);
    const [currentUserProfile, setCurrentUserProfile] = useState(null);
    const [page, setPage] = useState(null); 
    const [pageParams, setPageParams] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    
    // Firebase instances stored in refs/state
    const appRef = useRef(null);
    const authRef = useRef(null);
    const dbRef = useRef(null);
    const storageRef = useRef(null);

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

    // --- 1. Firebase Initialization and Auth Listener ---
    useEffect(() => {
        if (!firebaseConfig) {
            console.error("Firebase config not found.");
            return;
        }

        // Initialize Firebase services once
        if (!appRef.current) {
            try {
                appRef.current = initializeApp(firebaseConfig);
                authRef.current = getAuth(appRef.current);
                dbRef.current = getFirestore(appRef.current);
                storageRef.current = getStorage(appRef.current);
            } catch (e) {
                console.error("Firebase initialization error:", e);
                return;
            }
        }
        
        const auth = authRef.current;
        const db = dbRef.current;
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user && !user.isAnonymous && db) {
                try {
                    const userDoc = await getDoc(doc(db, `/artifacts/${appId}/public/data/users`, user.uid));
                    if (userDoc.exists()) {
                        setUser(user);
                        setCurrentUserProfile({ id: userDoc.id, ...userDoc.data() });
                        // Set default page if none is set
                        if (window.location.hash === '' || window.location.hash === '#') {
                            navigate('home');
                        }
                    } else {
                        // User exists in auth but not in DB (shouldn't happen after signup)
                        console.log("User found in auth but not in DB, signing out.");
                        await signOut(auth);
                    }
                } catch (error) {
                     console.error("Error fetching user profile during auth state change:", error);
                     await signOut(auth); // Sign out if profile fetch fails unexpectedly
                }
            } else {
                setUser(null);
                setCurrentUserProfile(null);
            }
            setIsLoading(false);
        });
        
        return () => unsubscribe();
    }, [navigate]);

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
                // Determine what type of parameter the second segment is
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
        return <div className="min-h-screen bg-black flex items-center justify-center text-white text-xl font-medium">Loading GamerGram...</div>;
    }
    
    // Get services after initialization
    const db = dbRef.current;
    const auth = authRef.current;
    const storage = storageRef.current;

    // --- Authentication Check ---
    if (!user || user.isAnonymous || !db || !auth) {
        return <AuthPage db={db} auth={auth} showNotification={showNotification} />;
    }

    // --- Page Renderer ---
    const renderPage = () => {
        if (!page || !currentUserProfile || !db || !auth) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Initializing UI...</div>;
        
        switch (page) {
            case 'profile':
                return <ProfilePage db={db} username={pageParams.username} currentUserProfile={currentUserProfile} setCurrentUserProfile={setCurrentUserProfile} showNotification={showNotification} navigate={navigate} />;
            case 'upload':
                return <UploadPage db={db} storage={storage} currentUserProfile={currentUserProfile} navigate={navigate} showNotification={showNotification} />;
            case 'explore':
                return <div className="p-8"><h1 className="text-3xl font-bold">Explore</h1><p className="text-gray-400 mt-4">Discover new creators and content. This page is coming soon!</p></div>;
            default: // home or tag/post filter
                return <HomePage db={db} currentUserProfile={currentUserProfile} tag={pageParams.tag} postId={pageParams.postId} showNotification={showNotification} navigate={navigate} />;
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
            <Layout currentUserProfile={currentUserProfile} navigate={navigate} auth={auth}>
                {renderPage()}
            </Layout>
        </>
    );
}
