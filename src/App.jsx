import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, deleteDoc, updateDoc, onSnapshot, query, where, setDoc, getDoc } from 'firebase/firestore';
import { PlusCircle, Trash2, Edit, Save, X, MoreVertical, CheckCircle, Clock } from 'lucide-react';

// --- CONFIGURACIÓN DE FIREBASE ---
// Nota: Las variables __firebase_config y __app_id se inyectan automáticamente en el entorno.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- INICIALIZACIÓN DE FIREBASE ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- COMPONENTES DE LA UI ---

const Modal = ({ children, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
                {children}
            </div>
        </div>
    );
};

const IncomeForm = ({ onAdd, onCancel }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('fijo');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (description && amount > 0) {
            onAdd({ description, amount: parseFloat(amount), type });
            setDescription('');
            setAmount('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 text-center">Añadir Ingreso</h3>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Salario, Venta, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Monto</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                    <option value="fijo">Fijo</option>
                    <option value="variable">Variable</option>
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 shadow-sm">Añadir</button>
            </div>
        </form>
    );
};

const ExpenseForm = ({ onAdd, onCancel }) => {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const expenseDate = new Date(date);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (description && amount > 0) {
            onAdd({
                description,
                amount: parseFloat(amount),
                date,
                status: expenseDate > today ? 'programado' : 'realizado'
            });
            setDescription('');
            setAmount('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 text-center">Añadir Gasto</h3>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Descripción</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Supermercado, Renta, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Monto</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha del Gasto</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    required
                />
                 <p className="text-xs text-gray-500 mt-1">Si eliges una fecha futura, el gasto se marcará como "programado".</p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 shadow-sm">Añadir</button>
            </div>
        </form>
    );
};


const BalanceForm = ({ onSave, onCancel, currentBalance }) => {
    const [balance, setBalance] = useState(currentBalance || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(parseFloat(balance));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 text-center">Balance Inicial del Mes</h3>
             <p className="text-sm text-center text-gray-500">Ingresa con cuánto dinero comienzas este mes.</p>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Monto Inicial</label>
                <input
                    type="number"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 shadow-sm">Guardar</button>
            </div>
        </form>
    );
};

// --- PANTALLAS PRINCIPALES ---

const IncomeScreen = ({ userId, incomes, onAdd, onDelete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fixedIncomes = incomes.filter(i => i.type === 'fijo');
    const variableIncomes = incomes.filter(i => i.type === 'variable');

    return (
        <div className="animate-fade-in">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <IncomeForm
                    onAdd={(income) => {
                        onAdd(income);
                        setIsModalOpen(false);
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
            
            <div className="p-4 md:p-6">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Ingresos</h2>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-transform transform hover:scale-105">
                        <PlusCircle size={20} />
                        <span>Añadir Ingreso</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-5 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-green-800">Ingresos Fijos</h3>
                         {fixedIncomes.length === 0 ? <p className="text-gray-500">No hay ingresos fijos.</p> :
                          fixedIncomes.map(income => (
                            <div key={income.id} className="flex justify-between items-center py-2 border-b">
                                <span>{income.description}</span>
                                <div className="flex items-center space-x-3">
                                    <span className="font-semibold text-green-600">${income.amount.toFixed(2)}</span>
                                    <button onClick={() => onDelete(income.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                </div>
                            </div>
                         ))}
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-green-800">Ingresos Variables</h3>
                        {variableIncomes.length === 0 ? <p className="text-gray-500">No hay ingresos variables.</p> :
                         variableIncomes.map(income => (
                            <div key={income.id} className="flex justify-between items-center py-2 border-b">
                                <span>{income.description}</span>
                                <div className="flex items-center space-x-3">
                                    <span className="font-semibold text-green-600">${income.amount.toFixed(2)}</span>
                                    <button onClick={() => onDelete(income.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExpensesScreen = ({ userId, expenses, onAdd, onDelete, onAuthorize }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const realizedExpenses = expenses.filter(e => e.status === 'realizado');
    const scheduledExpenses = expenses
        .filter(e => e.status === 'programado')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div className="animate-fade-in">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <ExpenseForm
                    onAdd={(expense) => {
                        onAdd(expense);
                        setIsModalOpen(false);
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
            
            <div className="p-4 md:p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Egresos</h2>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-orange-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-orange-600 transition-transform transform hover:scale-105">
                        <PlusCircle size={20} />
                        <span>Añadir Gasto</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Gastos Programados */}
                    <div className="bg-white p-5 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-orange-800 flex items-center"><Clock size={20} className="mr-2"/>Gastos Programados</h3>
                        {scheduledExpenses.length === 0 ? <p className="text-gray-500">No tienes gastos programados.</p> :
                         scheduledExpenses.map(expense => {
                            const expenseDate = new Date(expense.date + 'T00:00:00');
                            const canAuthorize = expenseDate <= today;
                            return (
                                <div key={expense.id} className={`flex justify-between items-center py-3 border-b ${canAuthorize ? 'bg-yellow-50 rounded-lg px-2 -mx-2' : ''}`}>
                                    <div>
                                        <p className="font-medium">{expense.description}</p>
                                        <p className="text-sm text-gray-500">Vence: {new Date(expense.date + 'T00:00:00').toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <span className="font-semibold text-orange-500">${expense.amount.toFixed(2)}</span>
                                        {canAuthorize ? (
                                             <button onClick={() => onAuthorize(expense.id)} title="Autorizar Gasto" className="text-green-500 hover:text-green-700"><CheckCircle size={22} /></button>
                                        ) : <div className="w-[22px]"></div>}
                                        <button onClick={() => onDelete(expense.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {/* Historial de Gastos */}
                    <div className="bg-white p-5 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-4 text-orange-800">Historial de Gastos</h3>
                        {realizedExpenses.length === 0 ? <p className="text-gray-500">Aún no hay gastos este mes.</p> :
                         realizedExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)).map(expense => (
                            <div key={expense.id} className="flex justify-between items-center py-2 border-b">
                                 <div>
                                    <p className="font-medium">{expense.description}</p>
                                    <p className="text-sm text-gray-500">{new Date(expense.date + 'T00:00:00').toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span className="font-semibold text-orange-500">${expense.amount.toFixed(2)}</span>
                                    <button onClick={() => onDelete(expense.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryScreen = ({ incomes, expenses, balance, onUpdateBalance }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const totalIncome = useMemo(() => incomes.reduce((sum, i) => sum + i.amount, 0), [incomes]);
    const totalExpense = useMemo(() => expenses.filter(e => e.status === 'realizado').reduce((sum, e) => sum + e.amount, 0), [expenses]);
    
    const finalBalance = balance + totalIncome - totalExpense;

    return (
        <div className="animate-fade-in p-4 md:p-6">
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <BalanceForm
                    currentBalance={balance}
                    onSave={(newBalance) => {
                        onUpdateBalance(newBalance);
                        setIsModalOpen(false);
                    }}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Resumen Mensual</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Balance Inicial */}
                <div className="bg-white p-5 rounded-xl shadow-md flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-500">Balance Inicial</h3>
                        <p className="text-3xl font-bold text-gray-800">${balance.toFixed(2)}</p>
                    </div>
                     <button onClick={() => setIsModalOpen(true)} className="text-gray-400 hover:text-blue-600"><Edit size={20} /></button>
                </div>

                {/* Ingresos */}
                <div className="bg-green-100 p-5 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-green-800">Total de Ingresos</h3>
                    <p className="text-3xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
                </div>

                {/* Egresos */}
                <div className="bg-orange-100 p-5 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-orange-800">Total de Gastos</h3>
                    <p className="text-3xl font-bold text-orange-500">${totalExpense.toFixed(2)}</p>
                </div>
            </div>

            {/* Resumen Final */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold text-center text-gray-800">Dinero Disponible</h3>
                <p className={`text-5xl font-extrabold text-center mt-2 ${finalBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${finalBalance.toFixed(2)}
                </p>
                <div className="mt-6 pt-6 border-t">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-green-500 h-4 rounded-full" style={{ width: `${(totalIncome / (totalIncome + totalExpense)) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                        <span className="text-green-600">Ingresos</span>
                        <span className="text-orange-600">Gastos</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL DE LA APP ---
export default function App() {
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('summary');
    
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [monthlyBalance, setMonthlyBalance] = useState({ id: null, amount: 0 });

    const currentMonthId = useMemo(() => new Date().toISOString().slice(0, 7), []); // "YYYY-MM"

    // Efecto para autenticación y carga inicial
    useEffect(() => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                await signInAnonymously(auth);
            }
        });
    }, []);
    
    // Efecto para escuchar cambios en los datos cuando el userId está disponible
    useEffect(() => {
        if (!userId) return;

        const setupListeners = () => {
            // Listener para Ingresos
            const incomesQuery = query(collection(db, `artifacts/${appId}/users/${userId}/incomes`));
            const unsubscribeIncomes = onSnapshot(incomesQuery, (snapshot) => {
                const incomesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setIncomes(incomesData);
            });

            // Listener para Egresos
            const expensesQuery = query(collection(db, `artifacts/${appId}/users/${userId}/expenses`), where("monthId", "==", currentMonthId));
            const unsubscribeExpenses = onSnapshot(expensesQuery, (snapshot) => {
                const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setExpenses(expensesData);
            });
            
            // Listener para Balance Mensual
            const balanceDocRef = doc(db, `artifacts/${appId}/users/${userId}/balances`, currentMonthId);
            const unsubscribeBalance = onSnapshot(balanceDocRef, (doc) => {
                if(doc.exists()){
                    setMonthlyBalance({ id: doc.id, amount: doc.data().amount });
                } else {
                    // Si no existe, lo creamos para el próximo mes, o seteamos el default
                     setMonthlyBalance({ id: currentMonthId, amount: 0 });
                }
            });

            setIsLoading(false);
            return () => {
                unsubscribeIncomes();
                unsubscribeExpenses();
                unsubscribeBalance();
            };
        }

        const unsubscribe = setupListeners();
        return () => unsubscribe && unsubscribe();

    }, [userId, currentMonthId]);


    // --- FUNCIONES CRUD ---
    const handleAddIncome = useCallback(async (income) => {
        if (!userId) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/incomes`), income);
    }, [userId]);

    const handleDeleteIncome = useCallback(async (id) => {
        if (!userId) return;
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/incomes`, id));
    }, [userId]);

    const handleAddExpense = useCallback(async (expense) => {
        if (!userId) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/expenses`), { ...expense, monthId: currentMonthId });
    }, [userId, currentMonthId]);

    const handleDeleteExpense = useCallback(async (id) => {
        if (!userId) return;
        await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/expenses`, id));
    }, [userId]);
    
    const handleAuthorizeExpense = useCallback(async (id) => {
        if (!userId) return;
        await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/expenses`, id), { status: 'realizado' });
    }, [userId]);

    const handleUpdateBalance = useCallback(async (amount) => {
        if(!userId) return;
        const balanceDocRef = doc(db, `artifacts/${appId}/users/${userId}/balances`, currentMonthId);
        await setDoc(balanceDocRef, { amount });
    }, [userId, currentMonthId]);

    const TabButton = ({ tabName, label, currentTab }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm md:text-base font-semibold rounded-lg transition-all duration-300
                ${currentTab === tabName 
                    ? (tabName === 'income' ? 'bg-green-600 text-white shadow-md' : tabName === 'expenses' ? 'bg-orange-500 text-white shadow-md' : 'bg-blue-600 text-white shadow-md')
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
        >
            {label}
        </button>
    );

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen bg-gray-50">Cargando aplicación...</div>;
    }

    return (
        <div className="bg-gray-100 min-h-screen font-sans">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <nav className="max-w-4xl mx-auto p-4 flex justify-center items-center space-x-2 md:space-x-4">
                    <TabButton tabName="income" label="Ingresos" currentTab={activeTab} />
                    <TabButton tabName="summary" label="Resumen" currentTab={activeTab} />
                    <TabButton tabName="expenses" label="Egresos" currentTab={activeTab} />
                </nav>
            </header>

            <main className="max-w-4xl mx-auto">
                {activeTab === 'summary' && <SummaryScreen incomes={incomes} expenses={expenses} balance={monthlyBalance.amount} onUpdateBalance={handleUpdateBalance} />}
                {activeTab === 'income' && <IncomeScreen userId={userId} incomes={incomes} onAdd={handleAddIncome} onDelete={handleDeleteIncome}/>}
                {activeTab === 'expenses' && <ExpensesScreen userId={userId} expenses={expenses} onAdd={handleAddExpense} onDelete={handleDeleteExpense} onAuthorize={handleAuthorizeExpense} />}
            </main>
             <footer className="text-center py-4 text-xs text-gray-400">
                App de Finanzas Personales. ID de sesión: <span className="font-mono">{userId}</span>
            </footer>
        </div>
    );
}

// Estilos para las animaciones
const style = document.createElement('style');
style.innerHTML = `
    @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes fade-in-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
        animation: fade-in 0.5s ease-out forwards;
    }
    .animate-fade-in-up {
        animation: fade-in-up 0.4s ease-out forwards;
    }
`;
document.head.appendChild(style);
