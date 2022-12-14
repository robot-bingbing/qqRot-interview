import { segment, Group } from 'oicq'
import { Question } from './entity/Question'
import {getAppDataSource} from './utils/index'
export default async function sendInterview(
  group: Group,
  isRandom: boolean,
  isAtAll: boolean,
  robotName: string
) {
  // 连接数据库
    const AppDataSource= await getAppDataSource()
  try {
    const questionRepository = AppDataSource.getRepository(Question)
    let rowData: Question | undefined | null = undefined

    if (isRandom) {
      // 随机
      const questions = await questionRepository.find()
      rowData = questions[Math.floor(Math.random() * questions.length)]
    } else {
      // 不随机
      rowData = await questionRepository.findOne({
        where: { isSend: false },
      })
    }
    // 没有面试题
    if (rowData === undefined || rowData === null) {
      // 飙泪表情
      const sadEnjoy = segment.face(210)
      await group.sendMsg(['没有面试题了哦,请耐心等待更新面试题哦! ', sadEnjoy])
    } else {
      // 有面试题
      // at全体
      const atAll = segment.at('all')
      const tip = segment.text('每日一题：\n')
      const invite = segment.text(` 大家快来和${robotName}一起做题吧! `)
      // 加油必胜表情
      const faceEnjoy = segment.face(245)
      await group.sendMsg([tip, rowData.question])
      isAtAll && (await group.getAtAllRemainder()) > 1
        ? await group.sendMsg([atAll, invite, faceEnjoy])
        : await group.sendMsg([invite, faceEnjoy])
      //如果不是随机，则更新为true，表示已经发过了
      if (!isRandom) {
        await questionRepository
          .createQueryBuilder()
          .update()
          .set({ isSend: true })
          .where({ qid: rowData.qid })
          .execute()
      }
    }
  } catch (error) {
    console.error(error)
  } finally {
    // 断开数据库连接
    await AppDataSource.destroy()
    console.log('数据库断开连接')
  }
}
