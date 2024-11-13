import { Request, Response, NextFunction } from 'express';
import { sqliteController } from '../database/sqliteController'
import { Database } from 'better-sqlite3';

const newRole: any = {};

export interface DatabaseController {
    db: Database;
    initialize: () => void;
    reset: () => void;
    close: () => void;
}

newRole.updateNewRole =  async (
    req: Request,
    res: Response, 
    next: NextFunction
): Promise<void> => {
    try {
        const { userId } = req.params;
        const { roleName } = req.body;
        const userIdNo = Number(userId)
        if(!roleName || !userId) {
         res.status(400).json({error: 'new Role is required'});
         return;
        }

        const newRole = await sqliteController.updateUserRole(res.locals.db, userIdNo, roleName)
        console.log('Role updated for user:', userId, 'New Role:', roleName);
        
        if(newRole.changes === 0) {
            res.status(404).json({ error: `User with ID ${userId} not found or role updated`})
        }
       res.locals.newRole = newRole
       next()
}catch(error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'An error occurred while updating the role'})
}
};

newRole.deleteUser = async( req: Request,
    res: Response, 
    next: NextFunction
): Promise<void> => {
    try {
        const { userId } = req.params;
        const userIdNo = Number(userId)
        if(!userId) {
            res.status(400).json({error: 'Invalid userId'});
            return;
        }

        const deleteUser = await sqliteController.deleteUser(res.locals.db, userIdNo )
        console.log('checking deleteUser', deleteUser)
        if(deleteUser.changes === 0) {
            res.status(404).json({ error: `User with ID ${userId} not found`})
            return;
        }
        res.locals.deletedUser = deleteUser;
        res.status(200).json({ message: `User with ID ${userId} deleted successfully`})
        next()
    } catch(error) {
        console.error(`Error delete user`, error);
        res.status(500).json({ error: 'An error occurred while deleting user'})
    }
}

export default newRole;