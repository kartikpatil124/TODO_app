import jwt from 'jsonwebtoken';

export default function auth(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ msg: 'No token, authorization denied' });

  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is missing.');
    return res.status(500).json({ msg: 'Authentication configuration error' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user; // { id: '...' }
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
}
