import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { sqliteController } from '../database/sqliteController';

interface User {
  id: number;
  username: string;
  password: string;
  role: string;
  email: string;
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
  const { username, password, role, email }: User = req.body;
  console.log('info', [username, password, role, email]);
  let userId: number
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    //Check if owner or admin accounts have been pre-initialized.
    if (role === 'owner' || 'admin') {
      const initialAccount: User = sqliteController.get(
        res.locals.db,
        'SELECT * from Users WHERE username = ? OR email = ?',
        [username, email]
      );
      userId = initialAccount.id;
      console.log(initialAccount)
      if(initialAccount.role === `pre-${role}`){
        sqliteController.run(res.locals.db, 'UPDATE Users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?', [
          username,
          email,
          hashedPassword,  
          role,
          userId,
        ]);
      } else return next({
        log: `Attempt to create uninitialized ${role}. Attempted account: ${[username, email]}`,
        status: 401,
        message: { err: 'You attempted to create a privileged account without initializing. Please contact instance owner.' },
      })
    } else {
    const insertUser = res.locals.db.prepare(
      'INSERT INTO Users (username, password, role, email) VALUES (?, ?, ?, ?)'
    );
    const result = insertUser.run(username, hashedPassword, role, email);
    userId= result.lastInsertRowid;
   }

    const token = jwt.sign(
      { userId, username, role, email },
      JWT_SECRET as string,
      { expiresIn: '24h' }
    );

    res.cookie('authToken', token, {
      //making not http only for now for simpler verification in authContext.
      //can make http only again if we want to create a verify route
      //httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600000 * 24,
    });

    res.locals.response = {
      token,
      username,
      userId,
      role,
      message: 'User registered successfully',
    };

    return next();
  } catch (error) {
    console.log(error);
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
      username.includes('@')
        ? 'SELECT * FROM Users WHERE email = ?'
        : 'SELECT * FROM Users WHERE username = ?'
    );
    const user = getUser.get(username) as User | undefined;

    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (isPasswordValid) {
        const { id, username, role, email }: User = user;
        const token = jwt.sign(
          { userId: id, username, role, email },
          process.env.JWT_SECRET as string,
          { expiresIn: '24h' }
        );

        res.cookie('authToken', token, {
          //httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 3600000 * 24,
        });

        res.locals.response = {
          token,
          userId: user.id,
          username,
          role,
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

authController.verify = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token: string;
  console.log(req.cookies);

  if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  } else
    return next({
      log: 'client has no token',
      status: 401,
      message: { err: 'Authentication Token Missing. Please log in.' },
    });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedJwt;

    if (typeof decoded === 'string') {
      return next({
        log: 'Invalid token format',
        status: 401,
        message: { err: 'Invalid token format' },
      });
    }
    if (decoded.userId && decoded.role) {
      const { userId, username, role } = decoded;
      res.locals.user = { userId, username, role };
      return next();
    } else {
      return next({
        log: 'Token payload missing userId or role',
        status: 401,
        message: { err: 'Invalid token payload' },
      });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    res.clearCookie('authToken');
    return next(error);
  }
};

export default authController;
