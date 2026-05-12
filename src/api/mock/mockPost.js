const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

function ok(data, message) {
  return { data: { success: true, message, data } }
}

let posts = []
let nextPostId = 1

export const mockPostApi = {
  async create(body) {
    await delay()
    const post = {
      postId: nextPostId++,
      title: body.title,
      postType: body.postType,
      createdAt: new Date().toISOString(),
    }
    posts.push({ ...body, ...post, nickname: '김여행' })
    return { data: { success: true, message: '게시글이 작성되었습니다.', data: post }, status: 701 }
  },

  async getAll(params = {}) {
    await delay()
    let result = [...posts]
    if (params.postType) result = result.filter((p) => p.postType === params.postType)
    if (params.attractionId) result = result.filter((p) => p.attractionId === params.attractionId)
    return ok({
      content: result.reverse().map(({ content, ...rest }) => rest),
      page: params.page || 0,
      size: params.size || 20,
      totalElements: result.length,
      totalPages: Math.ceil(result.length / (params.size || 20)) || 1,
    }, '게시글 목록 조회에 성공했습니다.')
  },
}
