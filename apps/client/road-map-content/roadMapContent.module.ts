import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassModule } from '../class/class.module';
import { Classes } from '../class/entities/class.entity';
import { MemberClasses } from '../memberClass/entities/memberClass.entity';
import { MemberClassService } from '../memberClass/services/memberClass.service';
import { Post } from '../post/entities/post.entity';
import { PostModule } from '../post/post.module';
import { PostService } from '../post/services/post.service';
import { RoadMap } from '../road-map/entities/road-map.entity';
import { RoadMapService } from '../road-map/services/roadMap.service';
import { UpLoadFile } from '../up-load-file/entities/upLoadFile.entity';
import { UpLoadFileService } from '../up-load-file/services/up-load-file.service';
import { User, UserSchema } from '../user/entities/user.entity';
import { UserService } from '../user/service/user.service';
import { LoggerService } from './../../share/services/logger.service';
import { RoadMapContentController } from './controllers/roadMapContent.controller';
import { RMCAssignment } from './entities/rmc-assignments';
import { RMCAssignmentUser } from './entities/rmc-assignmentsUser';
import { RMCAttendances } from './entities/rmc-attendances';
import { RMCAttendancesUser } from './entities/rmc-attendancesUser';
import { RMCFile } from './entities/rmc-files';
import { RoadMapContent } from './entities/roadMapContent.entity';
import { RMCAssignmentService } from './services/rmc-assignments.service';
import { RMCAssignmentUserService } from './services/rmc-assignmentsUserservice';
import { RMCAttendanceService } from './services/rmc-attendances.service';
import { RMCAttendancesUserService } from './services/rmc-attendancesUser.service';
import { RMCFilesService } from './services/rmc-files.service';
import { RoadMapContentService } from './services/roadMapContent.service';

@Module({
  imports: [
    ClassModule,
    PostModule,
    MongooseModule.forFeature([
      { name: Post.modelName, schema: Post.model.schema },
      { name: RoadMapContent.modelName, schema: RoadMapContent.model.schema },
      { name: RMCAssignment.modelName, schema: RMCAssignment.model.schema },
      { name: RMCAttendances.modelName, schema: RMCAttendances.model.schema },
      {
        name: RMCAssignmentUser.modelName,
        schema: RMCAssignmentUser.model.schema,
      },
      {
        name: RMCAttendancesUser.modelName,
        schema: RMCAttendancesUser.model.schema,
      },
      {
        name: RMCFile.modelName,
        schema: RMCFile.model.schema,
      },
      {
        name: RoadMap.modelName,
        schema: RoadMap.model.schema,
      },
      { name: Classes.modelName, schema: Classes.model.schema },
      {
        name: MemberClasses.modelName,
        schema: MemberClasses.model.schema,
      },
      { name: User.name, schema: UserSchema },
      { name: UpLoadFile.modelName, schema: UpLoadFile.model.schema },
    ]),
  ],
  controllers: [RoadMapContentController],
  providers: [
    // ClassService,
    PostService,
    LoggerService,
    RoadMapContentService,
    RMCAssignmentService,
    RMCAssignmentUserService,
    RMCAttendanceService,
    RMCAttendancesUserService,
    RMCFilesService,
    MemberClassService,
    UserService,
    UpLoadFileService,
    RoadMapService,
  ],
})
export class RoadMapContentModule {}
