// src/lib/challenge.ts

"use server"; // Marcamos o arquivo inteiro para rodar no servidor

import { db } from '@/lib/firebase/client'; // Usamos o client db para compatibilidade
import { doc, getDoc, setDoc } from "firebase/firestore";
import { AllManagedWatchedData, Challenge, ChallengeStep } from '@/types';
import { fetchWeeklyChallenge, formatWatchedDataForPrompt } from './gemini'; 
import { getTMDbDetails } from './tmdb';

/**
 * Retorna o identificador único para a semana atual.
 * Ex: "2025-33" (Ano 2025, 33ª semana)
 */
const getCurrentWeekId = (): string => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const day = startOfYear.getDay() > 0 ? startOfYear.getDay() : 7;
    const weekNumber = Math.ceil((((now.getTime() - startOfYear.getTime()) / 86400000) + day) / 7);
    return `${now.getFullYear()}-${weekNumber}`;
};

/**
 * Esta é a nossa Server Action. Ela só será executada no servidor.
 * Ela gera um novo desafio se um não existir para a semana.
 */
export const generateNewWeeklyChallenge = async (watchedData: AllManagedWatchedData): Promise<Challenge> => {
    const weekId = getCurrentWeekId();
    const challengeRef = doc(db, 'challenges', weekId);
    const challengeSnap = await getDoc(challengeRef);

    // Se já existir, apenas retorna o que está no banco
    if (challengeSnap.exists()) {
        return challengeSnap.data() as Challenge;
    }

    console.log("SERVER ACTION: Gerando novo desafio para a semana:", weekId);
    
    const allWatchedTitles = Object.values(watchedData).flat().map(item => item.title).join(', ');
    const currentDate = new Date().toLocaleDateString('pt-BR', { month: 'long', day: 'numeric' });
    const formattedData = await formatWatchedDataForPrompt(watchedData);

    // O seu prompt original está ótimo, sem necessidade de mudanças.
    const prompt = `Hoje é ${currentDate}. Você é o "CineGênio Pessoal". Sua tarefa é criar um "Desafio Semanal" criativo e temático para um usuário.

**TÍTULOS JÁ ASSISTIDOS (NUNCA SUGERIR):**
${allWatchedTitles}

**REGRAS:**  
1. **Tema Criativo:** Crie um nome de desafio ("challengeType") instigante, envolvente e memorável (ex: "Maratona do Mestre do Suspense", "Complexidade Cinematográfica", "Viagem aos Anos 80", "Explorando o Cinema Oriental").  
2. **Introdução Divertida:** O campo "reason" deve ser uma introdução curta, divertida e envolvente, no estilo narrativo:  
   "No desafio desta semana, [apresente de forma criativa a proposta] [tema do desafio: gênero que ele ama, diretor que ele deveria conhecer, ou mistura de estilos], vamos mergulhar nesses [quantidade de títulos da semana] filmes imperdíveis."  
3. **Quantidade de Filmes:** O desafio pode ser assistir a apenas 1 título especial ou uma lista de 2 a 7 títulos.  
4. **Conexão Pessoal:** O desafio deve se conectar com os gostos do usuário, mas também apresentar algo novo, surpreendente e fora da zona de conforto dele.  
5. **Formato Final:** Responda **apenas** com um objeto JSON que contenha:  
   - "challengeType" (nome do desafio)  
   - "reason" (introdução divertida)  
   - "titles" (array com os filmes escolhidos) 

**PERFIL DO USUÁRIO:**
${formattedData}

**Sua Tarefa:**
Gere UM desafio e responda APENAS com o objeto JSON.`;

    const challengeIdea = await fetchWeeklyChallenge(prompt);

    const enrichedSteps = await Promise.all(
        challengeIdea.steps!.map(async (step) => {
            const details = await getTMDbDetails(step.tmdbId, step.tmdbMediaType);
            const releaseDate = details.release_date || details.first_air_date;
            const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
            
            return {
                tmdbId: step.tmdbId,
                tmdbMediaType: step.tmdbMediaType,
                title: `${details.title || details.name} (${year})`,
                posterUrl: details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : undefined,
                completed: false,
            };
        })
    );

    const newChallenge: Challenge = {
        id: weekId,
        challengeType: challengeIdea.challengeType,
        reason: challengeIdea.reason,
        status: 'active',
        steps: enrichedSteps as ChallengeStep[],
    };

    await setDoc(challengeRef, newChallenge);
    return newChallenge;
};

/**
 * Atualiza um desafio existente no Firebase. Também é uma Server Action.
 */
export const updateChallenge = async (challenge: Challenge): Promise<void> => {
    const challengeRef = doc(db, 'challenges', challenge.id);
    await setDoc(challengeRef, challenge, { merge: true });
};