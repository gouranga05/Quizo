const checkUserStatus = (req, res, next) => {
	const user = req.user;

	if (user.isBlocked) {
		return res.status(403).json({
			status: false,
			error: 'Your account has been blocked by admin'
		});
	}

	next();
};


module.exports = checkUserStatus ;