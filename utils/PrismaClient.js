import {PrismaClient} from '@prisma/client'

let prismaInstance = null;
function getPrismaInstance() {

    if(!prismaInstance){
        prismaInstance = new PrismaClient(); // create a new instance of prisma to query db
    }

    return prismaInstance;
}


export default getPrismaInstance;