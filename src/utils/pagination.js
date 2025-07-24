
const pagination = (req) => {
    const page = parseInt(req.query.page) || 1
    let limit = parseInt(req.query.limit) || 10
    limit = limit > 50 ? 50 : limit
    const skip = (page - 1) * limit
    return {page,limit,skip}
}

module.exports=pagination


