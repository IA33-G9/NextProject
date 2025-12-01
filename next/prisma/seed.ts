const { PrismaClient, ScreenSize } = require('../src/generated/prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('シードの開始...');

  const cinema = await prisma.cinema.create({
    data: {
      name: 'HALシネマ',
      location: '東京都新宿区西新宿1-1-1',
    },
  });
  console.log(`映画館を作成しました: ${cinema.id}`);

  const screenDefinitions = [
    { number: '1', size: ScreenSize.LARGE, rows: 10, columns: 20, capacity: 200 },
    { number: '2', size: ScreenSize.LARGE, rows: 10, columns: 20, capacity: 200 },
    { number: '3', size: ScreenSize.LARGE, rows: 10, columns: 20, capacity: 200 },
    { number: '4', size: ScreenSize.MEDIUM, rows: 10, columns: 12, capacity: 120 },
    { number: '5', size: ScreenSize.MEDIUM, rows: 10, columns: 12, capacity: 120 },
    { number: '6', size: ScreenSize.SMALL, rows: 7, columns: 10, capacity: 70 },
    { number: '7', size: ScreenSize.SMALL, rows: 7, columns: 10, capacity: 70 },
    { number: '8', size: ScreenSize.SMALL, rows: 7, columns: 10, capacity: 70 },
  ];

  const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  for (const screenDef of screenDefinitions) {
    const screen = await prisma.screen.create({
      data: {
        number: screenDef.number,
        size: screenDef.size,
        rows: screenDef.rows,
        columns: screenDef.columns,
        capacity: screenDef.capacity,
        cinemaId: cinema.id,
      },
    });
    console.log(`スクリーン ${screenDef.number}番を作成しました: ${screen.id}`);

    const seatsData = [];
    for (let r = 0; r < screenDef.rows; r++) {
      const rowLetter = rowLetters[r];
      for (let c = 1; c <= screenDef.columns; c++) {
        seatsData.push({
          row: rowLetter,
          column: c,
          screenId: screen.id,
        });
      }
    }

    await prisma.seat.createMany({ data: seatsData });
    console.log(`スクリーン ${screenDef.number}番の座席 ${seatsData.length}席を作成しました`);
  }


  const samplemovie = await prisma.movie.create({
    data: {
      title: 'サンプル映画',
      description: 'これはサンプル映画の説明です。',
      releaseDate: new Date(),
      genre: 'アクション',
      director: 'サンプル監督',
      casts: 'サンプル俳優1, サンプル俳優2',
      duration: 120,
      imageUrl: null, // 画像URLは後で設定可能
    },
  });
  console.log(`テスト映画を作成しました: ${samplemovie.id}`);

  const startTime = new Date();
  startTime.setHours(startTime.getHours() + 1);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + samplemovie.duration);

  const screenOne = await prisma.screen.findFirst({ where: { number: '1' } });
  if (!screenOne) {
    throw new Error('スクリーン1番が見つかりませんでした');
  }

  const sampleshowing = await prisma.showing.create({
    data: {
      startTime,
      endTime,
      uniformPrice: null,
      screenId: screenOne.id,
      movieId: samplemovie.id,
    },
  });
  console.log(`テスト上映情報を作成しました: ${sampleshowing.id}`);

  // sampleUserは削除しました。adminユーザーを作成する際は、個々でアカウントを作成し、DBでadminをTrueにしてください。

  console.log('シードが正常に完了しました。');
}


main()
  .catch((e) => {
    console.error('シード中にエラーが発生しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
