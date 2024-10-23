import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sqliteController } from '../database/sqliteController';

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables');
  process.exit(1);
}
console.log('JWT_SECRET is set and its length is:', JWT_SECRET.length);

const authController: any = {};

authController.register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password, role } = req.body;
  console.log('info', [username, password, role]);
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertUser = res.locals.db.prepare(
      'INSERT INTO Users (username, password, role) VALUES (?, ?, ?)'
    );
    const result = insertUser.run(username, hashedPassword, role);
    const userId = result.lastInsertRowid;


    const token = jwt.sign(
      { userId, username, role },
      JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 * 24,
    });

    res.locals.response = {
      token,
      userId,
      message: 'User registered successfully',
    };
    
    return next();
  } catch (error) {
    next(error);
  }
};

authController.login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { username, password } = req.body;
  try {
    const getUser = res.locals.db.prepare(
      'SELECT * FROM Users WHERE username = ?'
    );
    const user = getUser.get(username) as User | undefined;

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const token = jwt.sign(
          { userId: user.id, username: user.username, role: user.role },
          process.env.JWT_SECRET as string,
          { expiresIn: '24h' }
        );

        res.cookie('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3600000 * 24,
        });

        res.locals.response = {
          token,
          userId: user.id,
          role: user.role,
          message: 'Login successful',
        };
        
        next();
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error during login' });
  }
};

interface DecodedJwt extends JwtPayload {
  userId?: string;
  role?: string;
}

authController.verify = async (req: Request, res: Response, next: NextFunction) => {
  let token: string;

  if (req.cookies && req.cookies.authToken){
    token = req.cookies.authToken;
  } else  return next({log: 'client has no token', status: 401, message:{ err: 'Authentication Token Missing. Please log in.'}})
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedJwt;

    if(typeof decoded === 'string') {
      return next({
        log: 'Invalid token format',
        status: 401,
        message: { err: 'Invalid token format' }
      });
    }
    if (decoded.userId && decoded.role) {
      res.locals.user = { userId: decoded.userId, role: decoded.role };
      return next();
    } else {
      return next({
        log: 'Token payload missing userId or role',
        status: 401,
        message: { err: 'Invalid token payload' }
      });
    }

  } catch (error) {
      console.error('Token verification error:', error);
      res.clearCookie('authToken');
      return next(error)
  }
};

export default authController;
