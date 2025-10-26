
import { useRef, useCallback } from 'react';
import type { Vector } from '../types';

const stopWords = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can\'t', 'cannot', 'could',
  'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d', 'he\'ll', 'he\'s',
  'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m',
  'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t',
  'so', 'some', 'such', 'than', 'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very', 'was', 'wasn\'t', 'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t',
  'what', 'what\'s', 'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom', 'why', 'why\'s',
  'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll', 'you\'re', 'you\'ve', 'your', 'yours',
  'yourself', 'yourselves'
]);

export const useTfIdf = () => {
    const documents = useRef<string[][]>([]);
    const termDocCounts = useRef<Map<string, number>>(new Map());

    const tokenize = (text: string): string[] => {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word && !stopWords.has(word));
    };
    
    const calculateTf = (tokens: string[]): Vector => {
        const tf: Vector = new Map();
        const tokenCount = tokens.length;
        if (tokenCount === 0) return tf;
        tokens.forEach(token => {
            tf.set(token, (tf.get(token) || 0) + 1);
        });
        tf.forEach((count, token) => {
            tf.set(token, count / tokenCount);
        });
        return tf;
    };

    const calculateIdf = useCallback((term: string): number => {
        const docCount = documents.current.length;
        const termDocCount = termDocCounts.current.get(term) || 0;
        if (termDocCount === 0) return 0;
        return Math.log(docCount / termDocCount);
    }, []);

    const createTfIdfVector = useCallback((tokens: string[]): Vector => {
        const tf = calculateTf(tokens);
        const tfIdfVector: Vector = new Map();
        tf.forEach((tfValue, term) => {
            const idf = calculateIdf(term);
            tfIdfVector.set(term, tfValue * idf);
        });
        return tfIdfVector;
    }, [calculateIdf]);

    const addDocument = useCallback((text: string): Vector => {
        const tokens = tokenize(text);
        documents.current.push(tokens);
        const uniqueTokens = new Set(tokens);
        uniqueTokens.forEach(token => {
            termDocCounts.current.set(token, (termDocCounts.current.get(token) || 0) + 1);
        });
        
        // Re-calculate all vectors is not efficient, but for this client-side app it's acceptable.
        // A better approach would be to calculate IDF on the fly when needed.
        // For simplicity, we just create the vector for the new document.
        return createTfIdfVector(tokens);
    }, [createTfIdfVector]);

    const calculateSimilarity = (vecA: Vector, vecB: Vector): number => {
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;

        const allTerms = new Set([...vecA.keys(), ...vecB.keys()]);

        allTerms.forEach(term => {
            const valA = vecA.get(term) || 0;
            const valB = vecB.get(term) || 0;
            dotProduct += valA * valB;
            magnitudeA += valA * valA;
            magnitudeB += valB * valB;
        });

        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);

        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }

        return dotProduct / (magnitudeA * magnitudeB);
    };
    
    return { addDocument, calculateSimilarity, documents };
};
