import { AuthService } from './../authentication/services/auth.service';
import { User } from 'apps/client/user/entities/user.entity';
import { SetOfQuestion } from './../set-of-questions/entities/setOfQuestions.entity';
import { SetOfQuestionsService } from './../set-of-questions/services/setOfQuestions.service';
import { Module } from '@nestjs/common';
import { AppGateway } from './socket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Question } from '../question/entities/question.entity';
import { QuestionService } from '../question/services/question.service';
import { UserMemberSocketService } from './services/userSocket.service';
import { UserMemberSocket } from './entities/userSocket.entity';
import { UserScoreQuizSocket } from './entities/userScoreQuizSocket.entity';
import { UserScoreQuizSocketService } from './services/userScoreQuizSocket.service';
import { UserHostSocketService } from './services/userHostSocket.service';
import { UserHostSocket } from './entities/userHostSocket.entity';
import { UserService } from '../user/service/user.service';
import { UserSchema } from '../user/entities/user.entity';
import { UpLoadFile } from '../up-load-file/entities/upLoadFile.entity';
import { LoggerService } from 'apps/share/services/logger.service';
import { UpLoadFileService } from '../up-load-file/services/up-load-file.service';
import { WsJwtGuard } from './socket.wsJwtGuard';
import { Auth, AuthSchema } from '../authentication/entities/auth.entity';
import { ConfigModule } from 'apps/share/configService.module';
import { JwtModule } from '@nestjs/jwt';
import { setupJWT } from 'apps/share/jwt/setupJwt';
import { DeviceService } from '../device/services/device.service';
import { Device } from '../device/entities/device.entity';
import { MemberClassService } from '../memberClass/services/memberClass.service';
import { NotificationService } from '../notifycation/services/notification.service';
import { MemberClasses } from '../memberClass/entities/memberClass.entity';
import { Notification } from '../notifycation/entities/notification.entity';
import { QuizClass } from '../quizClass/entities/quizClass.entity';
import { QuizClassScore } from '../quizClassScore/entities/quizClassScore.entity';
import { QuizClassScoreService } from '../quizClassScore/services/quizClassScore.service';
import { QuizClassService } from '../quizClass/services/quizClass.service';
import { ClassService } from '../class/services/class.service';
import { Classes } from '../class/entities/class.entity';
import { MessageModule } from './message/message.module';
import { MessageSocket } from './message/message.socket';
import { MessageService } from './message/message.service';
import { Admin, AdminSchema } from '../admin/entities/admin.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SetOfQuestion.modelName, schema: SetOfQuestion.model.schema },
      { name: Question.modelName, schema: Question.model.schema },
      {
        name: UserMemberSocket.modelName,
        schema: UserMemberSocket.model.schema,
      },
      {
        name: UserScoreQuizSocket.modelName,
        schema: UserScoreQuizSocket.model.schema,
      },
      {
        name: UserHostSocket.modelName,
        schema: UserHostSocket.model.schema,
      },
      { name: Auth.name, schema: AuthSchema },
      { name: User.name, schema: UserSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: UpLoadFile.modelName, schema: UpLoadFile.model.schema },
      { name: Device.modelName, schema: Device.model.schema },
      { name: MemberClasses.modelName, schema: MemberClasses.model.schema },
      { name: Notification.modelName, schema: Notification.model.schema },
      {
        name: QuizClass.modelName,
        schema: QuizClass.model.schema,
      },
      {
        name: QuizClassScore.modelName,
        schema: QuizClassScore.model.schema,
      },
      { name: Classes.modelName, schema: Classes.model.schema },
    ]),
    // MessageModule,
    ConfigModule,
    JwtModule.registerAsync(setupJWT('JWT_SECRET')),
  ],
  controllers: [],
  providers: [
    AppGateway,
    SetOfQuestionsService,
    QuestionService,
    UserMemberSocketService,
    UserScoreQuizSocketService,
    UserHostSocketService,
    UserService,
    AuthService,
    UpLoadFileService,
    LoggerService,
    WsJwtGuard,
    DeviceService,
    ClassService,
    MemberClassService,
    NotificationService,
    QuizClassService,
    QuizClassScoreService,
    MessageService,
    MessageSocket,
  ],
})
export class SocketModule {}
// UserScoreQuizSocket
