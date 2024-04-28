import {app} from './firebase';
import { getDatabase, ref, set, get, child, update, remove } from "firebase/database";
import uniqueid from '../utility/UniqueId';
import { uploadImage, deleteImage } from './firebaseStorage';
const db = getDatabase(app);

export const toggleLike = async (userId, postId) => {
    const postRef = ref(db, `posts/${postId}`);
    const userRef = ref(db, `users/${userId}`);
    const post = await get(postRef);
    const user = await get(userRef);
    const postLikes = post.val().likes || {};
    const userLikes = user.val().likes || {};
  
    if (postLikes[userId]) {
      delete postLikes[userId];
      delete userLikes[postId];
    } else {
      postLikes[userId] = userId;
      userLikes[postId] = postId;
    }
  
    const updates = {};
    updates[`/posts/${postId}/likes`] = postLikes;
    updates[`/users/${userId}/likes`] = userLikes;
  
    await update(ref(db), updates);
  }

// posts
export const getPost = async (id) => {
  const post = await get(ref(db, `posts/${id}`));
  console.log(post.val());
  return post.val();
}

export const addPost = async ({ title, content, userId, username, userImage, forum, image, link }) => {
  const id = uniqueid();
  const imageUrl = image ? await uploadImage(image, id) : null;
  const newPost = {
    forum,
    title,
    content,
    userId,
    username,
    userImage: userImage || null,
    image: imageUrl || null,
    link: link || null,
    id,
    timestamp: Date.now()
  }
  await set(ref(db, `posts/${id}`), newPost);
  await update(ref(db, `users/${userId}/posts`), {
    [id]: id
  });
  await toggleLike(userId, id);

  return id;
};

export const updatePost = async (id, title, content, userImage, image, link) => {
    const updates = {
        title,
        content,
        link: link || null,
        userImage: userImage || null,
        edited: true
    }
    if (image) {
        const imageUrl = await uploadImage(image, id);
        updates.image = imageUrl;
    }
    await update(ref(db, `posts/${id}`), updates);
    const post = await getPost(id);
    return post;
}

export const deletePost = async (id) => {
    const postRef = ref(db, `posts/${id}`);
    const post = await get(postRef);
    const userId = post.val().userId;
    const userRef = ref(db, `users/${userId}`);
    if (post.val().image) {
        await deleteImage(id);
    }
    await remove(postRef);
    await remove(child(userRef, `posts/${id}`));
}

export const getPosts = async () => {
    const posts = await get(ref(db, 'posts'));
  
    return Object.values(posts.val());
}


// users --most will be in auth--

export const getUser = async (id) => {
    const user = await get(ref(db, `users/${id}`));
    return user.val();
}

export const updateUser = async (id, updates) => {
    await update(ref(db, `users/${id}`), updates);
    const updatedUser = await getUser(id);
    return updatedUser;
}

export const deleteUser = async (id) => {
    await update(ref(db, `users/${id}`), {
        deleted: true
    });

}

export const getLikedPosts = async (userId) => {
    const user = await get(ref(db, `users/${userId}`));
    const likedPosts = user.val().likes;
    const posts = await get(ref(db, 'posts'));
    const likedPostList = [];
    for (const postId in likedPosts) {
        likedPostList.push(posts.val()[postId]);
    }
    return likedPostList;
}

export const getPostsByUser = async (userId) => {
    const user = await get(ref(db, `users/${userId}`));
    const userPosts = user.val().posts;
    const posts = await get(ref(db, 'posts'));
    const userPostList = [];
    for (const postId in userPosts) {
        userPostList.push(posts.val()[postId]);
    }
    return userPostList;
}

// comments
export const getComment = async (id) => {
    const comment = await get(ref(db, `comments/${id}`));
    return comment.val();
}

export const addComment = async (content, username, userId, postId, userImage, image) => {
    
    const id = uniqueid();
    const imageUrl = image ? await uploadImage(image, id) : null;
    const newComment = {
        content,
        userId,
        postId,
        id,
        imageUrl: imageUrl || null,
        timestamp: Date.now(),
        username,
        userImage
    }
    await set(ref(db, `comments/${id}`), newComment);
    await update(ref(db, `posts/${postId}/comments`), {
        [id]: id
    });
    await update(ref(db, `users/${userId}/comments`), {
        [id]: id
    });
    await toggleCommentLike(userId, id);
    return newComment;
}

export const toggleCommentLike = async (userId, commentId) => {
    const commentRef = ref(db, `comments/${commentId}`);
    const userRef = ref(db, `users/${userId}`);
    const comment = await get(commentRef);
    const user = await get(userRef);
    const commentLikes = comment.val().likes || {};
    const userLikes = user.val().commentLikes || {};

    if (commentLikes[userId]) {
        delete commentLikes[userId];
        delete userLikes[commentId];
    } else {
        commentLikes[userId] = userId;
        userLikes[commentId] = commentId;
    }

    const updates = {};
    updates[`/comments/${commentId}/likes`] = commentLikes;
    updates[`/users/${userId}/commentLikes`] = userLikes;

    await update(ref(db), updates);
}

export const getCommentsByPost = async (postId) => {
    const post = await get(ref(db, `posts/${postId}`));
    const comments = post.val().comments;
    const commentList = [];
    for (const commentId in comments) {
        const comment = await getComment(commentId);
        commentList.push(comment);
    }
    return commentList;
}

export const updateComment = async ( content, id, image, userImage) => {
    const updates = {
        content,
        edited: true,

        userImage: userImage || null,
    }
    if (image) {
        const imageUrl = await uploadImage(image, id);
        updates.imageUrl = imageUrl;
    }
    await update(ref(db, `comments/${id}`), updates);
    const comment = await getComment(id);
    return comment;
}

export const deleteComment = async (id, userId, postId) => {
    try {
        const commentRef = ref(db, `comments/${id}`);
        if(!commentRef) {
            return { success: false, message: 'Comment reference not found.' };
        }
        //if theres an image, delete that too
        const comment = await getComment(id);
        if (comment.imageUrl) {
            await deleteImage(id);
        }
        const postRef = ref(db, `posts/${postId}`);
        const userRef = ref(db, `users/${userId}`);
        await remove(commentRef);
        await remove(child(postRef, `comments/${id}`));
        await remove(child(userRef, `comments/${id}`));

        return { success: true, message: 'Comment deleted successfully.' };
    } catch (error) {
        console.error('Error deleting comment: ', error);
        return { success: false, message: error.message };
    }
}