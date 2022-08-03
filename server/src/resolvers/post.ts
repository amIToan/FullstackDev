import { PostMutationResponse } from "../types/PostMutationResponse";
import { Arg, ID, Mutation, Query, Resolver, Ctx, UseMiddleware } from "type-graphql";
import { CreatePostInput } from "../types/CreatePostInput";
import { Post } from "../entities/Post";
import { UpdatePostInput } from "../types/UpdatePostInput";
import { Context } from "../types/Context";
import { checkAuth } from "../middleware/checkType";
@Resolver()
export class PostResolver {
  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async createNewPost(
    @Arg("createPostInput") { title, text }: CreatePostInput
  ): Promise<PostMutationResponse> {
    try {
      const newPost = Post.create({
        title,
        text,
      });
      await newPost.save();
      return {
        code: 200,
        success: true,
        message: "Create the post successfully",
        post: newPost,
      };
    } catch (error) {
      console.log(error);
      return {
        code: 500,
        success: false,
        message: `Internal server error ${error.message}`,
      };
    }
  }
  @Query((_return) => Post, { nullable: true })
  async post(@Arg("id", (_type) => ID) id: number): Promise<Post | null> {
    try {
      const post = await Post.findOneBy({
        id: id,
      }); // find by id
      return post;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async updatePost(
    @Arg("updatePostInput") { id, title, text }: UpdatePostInput,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    const existingPost = await Post.findOneBy({
      id: id,
    }); // find by id
    if (!existingPost)
      return {
        code: 400,
        success: false,
        message: "Post not found",
      };

    // if (existingPost.userId !== req.session.userId) {
    // 	return { code: 401, success: false, message: 'Unauthorised' }
    // }

    existingPost.title = title;
    existingPost.text = text;

    await existingPost.save();

    return {
      code: 200,
      success: true,
      message: "Post updated successfully",
      post: existingPost,
    };
  }
  @Mutation((_return) => PostMutationResponse)
  @UseMiddleware(checkAuth)
  async deletePost(
    @Arg("id", (_type) => ID) id: number,
    @Ctx() { req }: Context
  ): Promise<PostMutationResponse> {
    const existingPost = await Post.findOneBy({
      id: id,
    }); // find by id
    console.log("session cookie", req.session);
    if (!existingPost)
      return {
        code: 400,
        success: false,
        message: "Post not found",
      };

    // if (existingPost.userId !== req.session.userId) {
    //   return { code: 401, success: false, message: "Unauthorised" };
    // }

    // await Upvote.delete({ postId: id });

    const deletedPost = await Post.delete({ id });
    if (deletedPost.affected === 1) {
      return {
        code: 200,
        success: true,
        message: "Post deleted successfully",
      };
    } else {
      return {
        code: 400,
        success: false,
        message: "There's something wrong!!!",
      };
    }
  }
}