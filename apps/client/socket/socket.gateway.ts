import { ClassService } from 'apps/client/class/services/class.service';
import { DFStatus } from 'apps/share/enums/status.enum';
import { SOCKET_EVENT } from './socket.events';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { SetOfQuestionsService } from '../set-of-questions/services/setOfQuestions.service';
import cors from 'cors';
import { QuestionService } from '../question/services/question.service';
import { UserHostSocketService } from './services/userHostSocket.service';
import { UserScoreQuizSocketService } from './services/userScoreQuizSocket.service';
import { UserMemberSocketService } from './services/userSocket.service';
import { RandomFunc } from 'apps/share/helpers/random';
import { WsJwtGuard } from './socket.wsJwtGuard';
import { User } from '../user/entities/user.entity';
import { UserHostSocket } from './entities/userHostSocket.entity';
import { DeviceService } from '../device/services/device.service';
import { MemberClassService } from '../memberClass/services/memberClass.service';
import { Notification } from '../notifycation/entities/notification.entity';
import { NotificationService } from '../notifycation/services/notification.service';
import { QuizClassService } from '../quizClass/services/quizClass.service';
import { QuizClassScoreService } from '../quizClassScore/services/quizClassScore.service';
import { Question } from '../question/entities/question.entity';
import { TYPE_QUESTION } from '../question/enum';

type typeSocket = Socket & { user: any };
@WebSocketGateway({ cors: true })
export class AppGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly _classService: ClassService,
    private readonly _questionService: QuestionService,
    private readonly _quizClassService: QuizClassService,
    private readonly _quizClassScoreService: QuizClassScoreService,
    private readonly _userHostSocketService: UserHostSocketService,
    private readonly _userScoreQuizSocketService: UserScoreQuizSocketService,
    private readonly _userMemberSocketService: UserMemberSocketService,
    private readonly _setOfQuestionsService: SetOfQuestionsService,
    private readonly _deviceService: DeviceService,
    private readonly _memberClassService: MemberClassService,
    private readonly _notificationService: NotificationService,
  ) {}

  @WebSocketServer() private server: Server;
  private logger: Logger = new Logger('AppGateway');
  private count = 0;

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SOCKET_EVENT.CREATE_QUIZ_CSS)
  private async handleCreateRoom(
    client: typeSocket,
    payload: {
      idSetOfQuestions: string;
      arrayQuestion?: string[];
      idClass: string;
      title: string;
      description: string;
    },
  ): Promise<void> {
    let questions = [];
    if (payload?.arrayQuestion && payload.arrayQuestion.length > 0) {
      questions = await this._questionService.findAll({
        _id: { $in: payload.arrayQuestion },
        idSetOfQuestions: payload.idSetOfQuestions,
        createBy: client.user._id,
      });
    } else {
      questions = await this._questionService.findAll({
        idSetOfQuestions: payload.idSetOfQuestions,
        createBy: client.user._id,
      });
    }

    if (questions.length <= 0) {
      this.server.to(client.id).emit(SOCKET_EVENT.CREATE_QUIZ_SSC, {
        msg: 'Dont find questions or not the owner of the room',
        idRoom: null,
        success: false,
      });
      return;
    }
    const mapIdQuestions = questions
      .map((e) => e._id)
      .sort(() => Math.random() - 0.5);

    const score = questions.reduce((t, v) => {
      return t + v.score;
    }, 0);

    const idRoom = RandomFunc();
    client.join(idRoom);

    const userHostSocket =
      await this._userHostSocketService.createUserHostSocket({
        idRoom: idRoom,
        host: client.id,
        idClass: payload.idClass,
        createBy: client.user.createdBy,
        questions: mapIdQuestions,
        title: payload.title,
        idSetOfQuestions: payload.idSetOfQuestions,
        score: score,
      });
    if (userHostSocket) {
      const listMember = await this._memberClassService.getMemberNotifyByClass(
        payload.idClass,
      );
      const currentClass = await this._classService.findById(payload.idClass);
      const listNotify = listMember.map((e: any) => {
        return {
          idUser: e.user,
          title: payload.title,
          description: payload.description,
          typeNotify: 'quiz',
          data: idRoom,
          image: currentClass.image,
        };
      });
      this._notificationService.createNotification(listNotify, idRoom);

      this.server.to(client.id).emit(SOCKET_EVENT.CREATE_QUIZ_SSC, {
        msg: 'Create Room Quiz Success',
        idRoom: idRoom,
        success: true,
      });
      return;
    } else {
      this.server.to(client.id).emit(SOCKET_EVENT.CREATE_QUIZ_SSC, {
        msg: 'Create Room Quiz Fail',
        idRoom: null,
        success: false,
      });
      return;
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SOCKET_EVENT.JOIN_ROOM_CSS)
  private async handleJoinRoom(
    client: typeSocket,
    payload: { idRoom: string },
  ): Promise<void> {
    const host = await this._userHostSocketService.findOne({
      idRoom: payload.idRoom,
    });
    if (host) {
      // createMemberSocket
      const newMember = await this._userMemberSocketService.createMemberSocket({
        idRoom: payload.idRoom,
        userId: client.user.createdBy,
        user: client.user,
        isHost: host.createBy === client.user.createdBy,
      });

      if (newMember) {
        this.count++;

        const listMember = await this._userMemberSocketService.findAll({
          idRoom: payload.idRoom,
        });
        this.server.to(client.id).emit(SOCKET_EVENT.JOIN_ROOM_NEW_SSC, {
          msg: 'Join Room Quiz Success User',
          users: listMember.map((e) => e.user),
          success: true,
        });
        //send nhung nguoi da join room

        client.to(host.idRoom).emit(SOCKET_EVENT.JOIN_ROOM_SSC, {
          msg: 'Join Room Quiz Success Users',
          user: client.user,
          success: true,
        });
        client.join(payload.idRoom);
        return;
      }
      this.server.to(client.id).emit(SOCKET_EVENT.JOIN_ROOM_SSC, {
        msg: 'Join Room Quiz False',
        err: false,
        success: false,
      });
      return;
    }
    this.server.to(client.id).emit(SOCKET_EVENT.JOIN_ROOM_SSC, {
      msg: 'Join Room Quiz  (Dont find room)',
      err: false,
      success: false,
    });
    return;
  }

  @SubscribeMessage(SOCKET_EVENT.START_QUIZ_CSS)
  private async handleStartQuiz(
    client: Socket,
    payload: { idRoom: string },
  ): Promise<void> {
    const host = await this._userHostSocketService.findOne({
      idRoom: payload.idRoom,
      host: client.id,
    });
    if (host) {
      if (host.play) {
        this.server.to(client.id).emit(SOCKET_EVENT.START_QUIZ_SSC, {
          msg: 'Start Game Fail, Game Stated',
          data: host,
          success: false,
        });
        return;
      }
      const startGame = await this._userHostSocketService.findOneAndUpdate(
        { _id: host._id },
        { play: true, currentQuestion: 0 },
      );
      if (startGame) {
        this.server.in(host.idRoom).emit(SOCKET_EVENT.START_QUIZ_SSC, {
          msg: 'Start Game Success',
          data: startGame,
          success: true,
        });
        this.handleTakeTheQuestion(startGame);
        return;
      }

      this.server
        .in(host.idRoom)
        .emit(SOCKET_EVENT.START_QUIZ_SSC, SOCKET_EVENT.START_QUIZ_SSC, {
          msg: 'Fail Game Success',
          data: startGame,
          success: false,
        });
      return;
    }
    this.server.emit(SOCKET_EVENT.START_QUIZ_SSC, {
      msg: 'Dont find host start game',
      data: null,
      success: false,
    });
  }

  @SubscribeMessage(SOCKET_EVENT.LEAVE_ROOM_CSS)
  @UseGuards(WsJwtGuard)
  private async handleLeaveRoom(
    client: typeSocket,
    payload: { idRoom: string },
  ): Promise<void> {
    const member = await this._userMemberSocketService.findOne({
      userId: client.user.createdBy,
      idRoom: payload.idRoom,
    });

    if (member) {
      client.leave(member.idRoom);

      const removeUserMember =
        await this._userMemberSocketService.findOneAndRemove({
          userId: client.user.createdBy,
          idRoom: payload.idRoom,
        });
      if (removeUserMember) {
        this.server.in(payload.idRoom).emit(SOCKET_EVENT.LEAVE_ROOM_SSC, {
          msg: 'Leave Room Success',
          data: { idUser: client.user },
          success: true,
        });
        return;
      }
      this.server.to(client.id).emit(SOCKET_EVENT.LEAVE_ROOM_SSC, {
        msg: 'Leave Room False (Dont find Room and remove)',
        data: { idUser: null },
        success: false,
      });
      return;
    } else {
      this.server.to(client.id).emit(SOCKET_EVENT.LEAVE_ROOM_SSC, {
        msg: 'Leave Room False (Dont find User)',
        data: { idUser: null },
        success: false,
      });
      return;
    }
  }

  // private  calcPointWithQuestion(question:Question,answer:string|Array<string>):number{
  //   let defaulScore=0
  //   switch (question.typeQuestion)
  //   {
  //     case TYPE_QUESTION.MULTI_CHOOSE:
  //       if(Array.isArray(answer))
  //       {
  //         const arrayAnswerMatch=answer.reduce((pre,current,index)=>{
  //           const findIndexAnswer= question.answers.findIndex(val=>val===current)
  //           if(findIndexAnswer === -1)
  //           {
  //             return [...pre,findIndexAnswer]
  //           }
  //           return pre
  //         },[])

  //         const count:number= arrayAnswerMatch.reduce((pre,current)=>{
  //           const matchCorrect =question.correct.findIndex((e) => e === current);
  //           if (matchCorrect !== -1) {
  //             return pre+1
  //           }
  //           return pre
  //         },0)

  //         return parseFloat((count/question.correct.length).toFixed(2))*question.score
  //       }
  //       return defaulScore;
  //     case TYPE_QUESTION.CHOOSE:
  //       const matchAnswerSchoose=answer === question.answers?.[question.correct?.[0]]
  //       if(matchAnswerSchoose) return question.score
  //       return defaulScore;
  //     case TYPE_QUESTION.BOOLEAN:
  //       const matchAnswerBoolean=answer === question.answers?.[question.correct?.[0]]
  //       if(matchAnswerBoolean) return question.score
  //       return defaulScore;
  //     default: return defaulScore
  //   }
  // }

  private async handleNotifyEndQuiz(host: UserHostSocket): Promise<void> {
    // this.server.in(host.idRoom).emit(SOCKET_EVENT.END_QUIZ_SSC, {
    //   msg: 'End Quiz',
    //   success: true,
    // });
    const classScore = await this._quizClassService.createQuizClass({
      classId: host.idClass,
      setOfQuestionId: host.idSetOfQuestions,
      title: host.title,
      createBy: host.createBy,
      score: host.score,
    });
    if (classScore) {
      const listMember = await this._userScoreQuizSocketService.findScore(
        host.idRoom,
      );
      const listQuizClassScore = [];
      for (const user of listMember) {
        const resultSaveQuizClass =
          await this._quizClassScoreService.createQuizClassScore({
            memberId: user._id.idUser,
            score: user.score,
            quizClassId: classScore._id,
          });
        if (resultSaveQuizClass) {
          listQuizClassScore.push(resultSaveQuizClass);
        }
      }

      this.server
        .in(host.idRoom)
        .emit(SOCKET_EVENT.STATISTICAL_ROOM_FINAL_SSC, {
          msg: 'STATISTICAL_ROOM_FINAL_SSC',
          success: true,
          data: {
            member: listQuizClassScore,
            class: classScore,
          },
        });
      for (const user of listMember) {
        this._userScoreQuizSocketService.removeUserHostSocket(
          user._id.idUser,
          host.idRoom,
        );
      }
      this._userHostSocketService.removeUserHostSocket(
        host.createBy,
        host.idRoom,
      );
      this._userMemberSocketService.removeUserByRoom(host.idRoom);
    }
  }

  private async handleStatistQuizFinal(idRoom: string): Promise<void> {
    const listScoreStatist = await this._userScoreQuizSocketService.findAll({
      idRoom,
    });
    this.server.to(idRoom).emit(SOCKET_EVENT.STATISTICAL_ROOM_FINAL_SSC, null);
  }

  //Thong ke sau khi tra loi cau hoi
  private async handleStatistQuiz(
    idRoom: string,
    idQuestion: string,
  ): Promise<void> {
    const listScoreStatist = await this._userScoreQuizSocketService.findAll({
      idRoom,
      idQuestion,
    });
    const question = await this._questionService.findById(idQuestion);
    const objResult = question.answers.reduce(
      (t, v) => {
        return { ...t, [v]: 0 };
      },
      { null: 0 },
    );
    const result: Record<string, number> = listScoreStatist.reduce((t, v) => {
      if (t[v.answer]) {
        // userId
        t[v.answer] = t[v.answer] + 1;
      } else {
        t[v.answer] = 1;
      }
      return t;
    }, objResult);
    this.server.to(idRoom).emit(SOCKET_EVENT.STATISTICAL_ROOM_SSC, {
      data: result,
      msg: 'STATISTICAL_ROOM_SSC',
      success: true,
    });
  }
  // SEND_FCM_TOKEN_CSS
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SOCKET_EVENT.SEND_FCM_TOKEN_CSS)
  private async handleSaveDevice(
    client: typeSocket,
    payload: {
      appVersion: string;
      deviceModel: string;
      deviceUUid: string;
      fcmToken: string;
    },
  ): Promise<void> {
    const obj = Object.assign({}, payload, {
      createdBy: client.user._id,
    });
    await this._deviceService.createDevice(obj);
  }


  private chunkArray = (inputArray, perChunk=2) => {
    if(inputArray&&Array.isArray(inputArray))
    return inputArray.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / perChunk)
  
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [] // start a new chunk
      }
  
      resultArray[chunkIndex].push(item)
  
      return resultArray
    }, [])
    return []
  }

  private mathTwoArray = (inputArray, inputArray2) => {
    let result = [];
    for (let i = 0; i < inputArray.length; i++) {
      for (let j = 0; j < inputArray2.length; j++) {
        const value1 = inputArray[i].sort((a, b) => a - b).join('-');
        const value2 = inputArray2[j].sort((a, b) => a - b).join('-');
        if (value1 === value2) {
          result.push(inputArray[i]);
        }
      }
    }
    return result.length === inputArray.length && result.length === inputArray2.length
  }

  //Dap An cau hoi
  @UseGuards(WsJwtGuard)
  @SubscribeMessage(SOCKET_EVENT.ANSWER_THE_QUESTION_CSS)
  private async handleAnswerTheQuestion(
    client: typeSocket,
    payload: {
      idRoom: string;
      answer: string;
      idQuestion: string;
    },
  ): Promise<void> {
    const host = await this._userHostSocketService.findOne({
      idRoom: payload.idRoom,
      host: client.id,
    });
    if (host) return;
    const question = await this._questionService.findById(payload.idQuestion);

    if (question) {
      const user = await this._userMemberSocketService.findOne({
        idRoom: payload.idRoom,
        userId: client.user.createdBy,
      });

      if (!user) {
        return;
      }

      // let score = this.calcPointWithQuestion(question,payload.answer);
      console.log(
        'payload.answer',
        payload.answer,
        question.answers,
        question.correct,
      );
      let score = 0;
      if(question.typeQuestion ===7)// keo tha
      {
        if(this.mathTwoArray(this.chunkArray(payload.answer.split(',')),this.chunkArray(question.correct)))
        {
          score = question.score;
        }
      }else{
        if (payload.answer && question.answers.includes(payload.answer)) {
          const iz = question.answers.findIndex((e) => e === payload.answer);
          if (iz !== -1) {
            const correct = question.correct.findIndex((e) => ~~e === iz);
            if (correct !== -1) {
              if (question.typeQuestion === TYPE_QUESTION.MULTI_CHOOSE) {
                score = Math.floor(question.score / question.correct.length);
              } else score = question.score;
            }
          }
        }
      }

      
      const newUserScore =
        await this._userScoreQuizSocketService.createUserHostSocket({
          ...payload,
          score,
          question: question.question,
          userId: client.user.createdBy,
          socketId: client.id,
        });
      // this.server.emit(SOCKET_EVENT.ANSWER_THE_QUESTION_SSC, payload);
    }
  }

  //get cau hoi
  // @SubscribeMessage(SOCKET_EVENT.TAKE_THE_QUESTION_CSS)
  private async handleTakeTheQuestion(host: UserHostSocket): Promise<void> {
    console.log("get Question")
    const currentQuestion = await this._questionService.findById(
      host.questions[host.currentQuestion],
      'banner audio',
    );
    if (currentQuestion) {
      const payload = {
        _id: currentQuestion._id,
        question: currentQuestion.question,
        answers: currentQuestion.answers,
        duration: currentQuestion.duration,
        idRoom: host.idRoom,
        banner: currentQuestion.banner,
        typeQuestion: currentQuestion.typeQuestion,
        indexQuestion: `${host.currentQuestion + 1}/${host.questions.length}`,
      };
      console.log("get Question",payload)

      const nextGame = await this._userHostSocketService.findOneAndUpdate(
        { _id: host._id },
        { currentQuestion: host.currentQuestion + 1 },
      );
      if (nextGame) {
        this.server.in(host.idRoom).emit(SOCKET_EVENT.TAKE_THE_QUESTION_SSC, {
          msg: 'Take Question Success',
          data: payload,
          success: true,
        });

        setTimeout(async () => {
          const userAnswer = await this._userScoreQuizSocketService.findAll({
            idRoom: host.idRoom,
            idQuestion: currentQuestion._id,
          });

          const userDontAnswer = await this._userMemberSocketService.findAll({
            userId: { $nin: userAnswer.map((e) => e.userId) },
            idRoom: host.idRoom,
            isHost: false,
          });

          // const payload = {
          //   idRoom: host.idRoom,
          //   answer: null,
          //   idQuestion: currentQuestion._id,
          // };

          for (const uda of userDontAnswer) {
            await this._userScoreQuizSocketService.createUserHostSocket({
              idRoom: host.idRoom,
              answer: null,
              idQuestion: currentQuestion._id,
              score: 0,
              question: currentQuestion.question,
              userId: uda.userId,
              socketId: '',
            });
          }

          this.handleStatistQuiz(
            host.idRoom,
            host.questions[host.currentQuestion],
          );

          setTimeout(() => {
            this.handleTakeTheQuestion(nextGame);
          }, 3500);
        }, currentQuestion.duration * 1000);

        return;
      }
      return;
    }
    if (host.questions[host.currentQuestion] === undefined) {
      this.handleNotifyEndQuiz(host);
      return;
    }
    this.server.in(host.idRoom).emit(SOCKET_EVENT.TAKE_THE_QUESTION_SSC, {
      msg: 'Dont find Question Fail Server',
      data: null,
      success: false,
    });
    return;
  }
  afterInit(server: Server) {
    this.logger.log('Init');
  }

  @UseGuards(WsJwtGuard)
  async handleDisconnect(client: typeSocket) {
    // const results = await this._userMemberSocketService.findOneAndRemove({
    //   userId: client.user._id,
    // });
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtGuard)
  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }
}
