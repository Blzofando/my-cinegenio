// src/app/api/cron/route.ts

import { NextResponse } from 'next/server';
import { getWatchedItems } from '@/lib/firestore';
import { updateTMDbRadarCache, updateRelevantReleases } from '@/lib/radar';
import { updateWeeklyRelevantsIfNeeded } from '@/lib/weeklyRelevants';
import { generateNewWeeklyChallenge } from '@/lib/challenge';
import { AllManagedWatchedData } from '@/types';

export async function GET(request: Request) {
    // 1. Segurança
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    // 2. Lógica do Dia da Semana
    // A Vercel usa o fuso horário UTC.
    const today = new Date();
    const dayOfWeek = today.getUTCDay(); // 0 = Domingo, 1 = Segunda, 2 = Terça, etc.

    const tasksToRun: Promise<void>[] = [];
    let tasksSummary: string[] = [];

    // --- Tarefa Diária ---
    console.log("CRON: Verificando tarefa diária...");
    tasksToRun.push(updateTMDbRadarCache());
    tasksSummary.push("Radar TMDb");

    // --- Tarefas Semanais ---
    // Apenas executa se for o dia certo da semana
    if (dayOfWeek === 0) { // Domingo
        console.log("CRON: Hoje é Domingo, executando tarefa do Desafio Semanal.");
        // Funções que precisam de 'watchedData'
        const watchedItems = await getWatchedItems();
        const watchedData: AllManagedWatchedData = {
            amei: watchedItems.filter(i => i.rating === 'amei'),
            gostei: watchedItems.filter(i => i.rating === 'gostei'),
            meh: watchedItems.filter(i => i.rating === 'meh'),
            naoGostei: watchedItems.filter(i => i.rating === 'naoGostei'),
        };
        tasksToRun.push(generateNewWeeklyChallenge(watchedData).then(() => {}));
        tasksSummary.push("Desafio Semanal");

    } else if (dayOfWeek === 1) { // Segunda-feira
        console.log("CRON: Hoje é Segunda, executando tarefa dos Relevantes da Semana.");
        const watchedItems = await getWatchedItems();
        const watchedData: AllManagedWatchedData = {
            amei: watchedItems.filter(i => i.rating === 'amei'),
            gostei: watchedItems.filter(i => i.rating === 'gostei'),
            meh: watchedItems.filter(i => i.rating === 'meh'),
            naoGostei: watchedItems.filter(i => i.rating === 'naoGostei'),
        };
        tasksToRun.push(updateWeeklyRelevantsIfNeeded(watchedData));
        tasksSummary.push("Relevantes da Semana");

    } else if (dayOfWeek === 2) { // Terça-feira
        console.log("CRON: Hoje é Terça, executando tarefa do Radar Relevante (IA).");
        tasksToRun.push(updateRelevantReleases());
        tasksSummary.push("Radar Relevante (IA)");
    }

    // 3. Execução
    try {
        console.log(`CRON: Executando as seguintes tarefas: ${tasksSummary.join(', ')}`);
        await Promise.all(tasksToRun);
        console.log("CRON: Tarefas concluídas com sucesso.");
        return NextResponse.json({ success: true, executed_tasks: tasksSummary });
    } catch (error) {
        console.error("CRON: Erro durante a execução das tarefas:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}