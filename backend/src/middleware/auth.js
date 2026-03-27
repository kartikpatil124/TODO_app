import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ msg: 'No token, authorization denied' });

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user; // { id: '...' }
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
}
