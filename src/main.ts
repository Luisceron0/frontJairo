import '@/styles/main.css'
import { router } from '@/router/router'
import { MazoListView } from '@/views/MazoListView'
import { SesionView } from '@/views/SesionView'
import { DashboardView } from '@/views/DashboardView'
import { GeminiView } from '@/views/GeminiView'
import { mazoController } from '@/controllers/MazoController'
import { sesionController } from '@/controllers/SesionController'
import { geminiController } from '@/controllers/GeminiController'
import { auditor } from '@/utils/auditor'

/**
 * Punto de entrada de la aplicación StudyFlow
 */

class App {
  private appContainer: HTMLElement | null = null
  private mazoListView: MazoListView | null = null
  private sesionView: SesionView | null = null
  private dashboardView: DashboardView | null = null
  private geminiView: GeminiView | null = null

  async inicializar(): Promise<void> {
    console.log('[App] Inicializando StudyFlow...')

    this.appContainer = document.getElementById('app')
    if (!this.appContainer) {
      console.error('Container #app no encontrado')
      return
    }

    this.renderizarLayout()
    this.configurarRutas()
    this.cargarRutaInicial()

    // Ejecutar auditoría en segundo plano
    try {
      const reporte = await auditor.ejecutarAuditoria()
      auditor.imprimirReporte(reporte)
      await auditor.validarFuncionalidades()
    } catch (error) {
      console.warn('[App] Auditoría completada con advertencias:', error)
    }

    console.log('[App] StudyFlow listo')
  }

  private renderizarLayout(): void {
    this.appContainer!.innerHTML = `
      <div class="min-h-screen bg-neutral-50">
        <!-- Header -->
        <header class="header">
          <div class="main-container flex justify-between items-center py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-accent-500 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-lg">SF</span>
              </div>
              <h1 class="text-2xl font-bold text-primary-500">StudyFlow</h1>
            </div>
            <nav class="flex gap-6">
              <button id="nav-inicio" class="text-neutral-600 hover:text-accent-500 font-medium transition-colors">
                Inicio
              </button>
              <button id="nav-dashboard" class="text-neutral-600 hover:text-accent-500 font-medium transition-colors">
                Progreso
              </button>
            </nav>
          </div>
        </header>

        <!-- Main Content -->
        <main class="main-container py-8">
          <div id="content"></div>
        </main>
      </div>
    `

    // Event listeners del header
    document.getElementById('nav-inicio')?.addEventListener('click', () => {
      router.navegar('inicio')
    })

    document.getElementById('nav-dashboard')?.addEventListener('click', () => {
      router.navegar('dashboard')
    })
  }

  private configurarRutas(): void {
    // Ruta: Inicio (lista de mazos)
    router.enRuta('inicio', () => {
      this.mostrarInicio()
    })

    // Ruta: Sesión de estudio
    router.enRuta('sesion', () => {
      this.mostrarSesion()
    })

    // Ruta: Dashboard
    router.enRuta('dashboard', () => {
      this.mostrarDashboard()
    })

    // Ruta: Análisis con Gemini
    router.enRuta('gemini', () => {
      this.mostrarGemini()
    })
  }

  private cargarRutaInicial(): void {
    router.navegar('inicio')
  }

  private limpiarContenido(): void {
    const content = document.getElementById('content')
    if (content) {
      content.innerHTML = ''
    }
  }

  private mostrarInicio(): void {
    this.limpiarContenido()

    const content = document.getElementById('content')
    if (!content) return

    content.innerHTML = '<div id="mazo-list-container"></div>'

    this.mazoListView = new MazoListView('mazo-list-container')
    this.mazoListView.setEventHandlers({
      onMazoClick: (mazo) => {
        console.log('Mazo seleccionado:', mazo)
        this.mostrarOpciones(mazo)
      },
      onEditClick: (mazo) => {
        console.log('Editar mazo:', mazo)
        alert('Funcionalidad de edición en desarrollo')
      },
      onDeleteClick: (mazo) => {
        this.eliminarMazo(mazo.id)
      },
      onNewClick: () => {
        console.log('Crear nuevo mazo')
        alert('Funcionalidad de creación en desarrollo')
      },
    })

    this.mazoListView.cargarMazos()
  }

  private mostrarOpciones(mazo: any): void {
    const opciones = `
      <div class="modal-backdrop">
        <div class="modal-content">
          <div class="card-header">
            <h2 class="text-xl font-bold">Opciones</h2>
          </div>
          <div class="p-6 space-y-3">
            <button id="btn-estudiar" class="btn-accent w-full justify-start">
              Estudiar Ahora
            </button>
            <button id="btn-ver-progreso" class="btn-secondary w-full justify-start">
              Ver Progreso
            </button>
            <button id="btn-analizar-ia" class="btn-secondary w-full justify-start">
              Analizar con IA
            </button>
            <button id="btn-cerrar" class="btn-outline w-full">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `

    document.body.insertAdjacentHTML('beforeend', opciones)

    document.getElementById('btn-estudiar')?.addEventListener('click', () => {
      this.iniciarSesion(mazo.id)
      document.querySelector('.modal-backdrop')?.remove()
    })

    document.getElementById('btn-ver-progreso')?.addEventListener('click', () => {
      router.navegar('dashboard')
      document.querySelector('.modal-backdrop')?.remove()
    })

    document.getElementById('btn-analizar-ia')?.addEventListener('click', () => {
      this.analizarConGemini(mazo.id)
      document.querySelector('.modal-backdrop')?.remove()
    })

    document.getElementById('btn-cerrar')?.addEventListener('click', () => {
      document.querySelector('.modal-backdrop')?.remove()
    })
  }

  private async iniciarSesion(mazoId: string): Promise<void> {
    try {
      await sesionController.iniciarSesion({ mazoId })
      router.navegar('sesion')
    } catch (error) {
      alert('Error al iniciar sesión')
      console.error(error)
    }
  }

  private async mostrarSesion(): Promise<void> {
    this.limpiarContenido()

    const content = document.getElementById('content')
    if (!content) return

    content.innerHTML = '<div id="sesion-container"></div>'

    this.sesionView = new SesionView('sesion-container')

    const sesion = sesionController.obtenerSesionActiva()
    if (sesion) {
      this.sesionView.setEventHandlers({
        onSesionFinalizada: () => {
          console.log('Sesión finalizada')
        },
        onSesionCancelada: () => {
          router.navegar('inicio')
        },
      })
      this.sesionView.mostrarSesion(sesion)
    } else {
      alert('No hay sesión activa')
      router.navegar('inicio')
    }
  }

  private async mostrarDashboard(): Promise<void> {
    this.limpiarContenido()

    const content = document.getElementById('content')
    if (!content) return

    content.innerHTML = '<div id="dashboard-container"></div>'

    this.dashboardView = new DashboardView('dashboard-container')

    // Obtener el ID del último mazo visto (simplificado)
    const mazoId = sessionStorage.getItem('lastMazoId') || '1'
    await this.dashboardView.cargarProgreso(mazoId)
  }

  private async analizarConGemini(mazoId: string): Promise<void> {
    try {
      this.limpiarContenido()

      const content = document.getElementById('content')
      if (!content) return

      content.innerHTML = '<div id="gemini-container"></div>'
      content.innerHTML += '<p class="p-6 text-center text-neutral-500">Analizando mazo...</p>'

      const analisis = await geminiController.analizarMazo(mazoId)

      content.innerHTML = '<div id="gemini-container"></div>'

      this.geminiView = new GeminiView('gemini-container')
      this.geminiView.setEventHandlers({
        onAceptarClick: async (tarjetas) => {
          try {
            content.innerHTML = '<p class="p-6 text-center text-neutral-500">Agregando tarjetas...</p>'
            await geminiController.aceptarTarjetasSugeridas(mazoId, tarjetas)
            alert(`Se agregaron ${tarjetas.length} tarjetas correctamente`)
            router.navegar('inicio')
          } catch (error) {
            alert('Error al agregar tarjetas')
            console.error(error)
          }
        },
        onCancelarClick: () => {
          router.navegar('inicio')
        },
      })

      this.geminiView.mostrarAnalisis(analisis)
    } catch (error) {
      alert('Error al analizar mazo con IA')
      console.error(error)
      router.navegar('inicio')
    }
  }

  private async eliminarMazo(mazoId: string): Promise<void> {
    try {
      await mazoController.eliminarMazo(mazoId)
      alert('Mazo eliminado')
      this.mostrarInicio()
    } catch (error) {
      alert('Error al eliminar mazo')
      console.error(error)
    }
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  const app = new App()
  app.inicializar()
})
