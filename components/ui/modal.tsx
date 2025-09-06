"use client"

import { Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from "@heroicons/react/24/outline"
import { Button } from "@/components/ui/button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: "error" | "success" | "warning" | "info"
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  showCancel?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  showCancel = false
}: ModalProps) {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    }
    onClose()
  }

  const getIcon = () => {
    switch (type) {
      case "error":
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
      case "success":
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />
      case "warning":
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case "error":
        return {
          bg: "bg-red-50",
          text: "text-red-800",
          button: "jd-button-danger"
        }
      case "success":
        return {
          bg: "bg-green-50",
          text: "text-green-800",
          button: "jd-button-primary"
        }
      case "warning":
        return {
          bg: "bg-yellow-50",
          text: "text-yellow-800",
          button: "jd-button-warning"
        }
      default:
        return {
          bg: "bg-blue-50",
          text: "text-blue-800",
          button: "jd-button-primary"
        }
    }
  }

  const colors = getColorClasses()

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${colors.bg}`}>
                      {getIcon()}
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className={`p-4 rounded-lg ${colors.bg} mb-6`}>
                  <p className={`text-sm ${colors.text}`}>
                    {message}
                  </p>
                </div>

                <div className="flex gap-3 justify-end">
                  {showCancel && (
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="jd-button-secondary"
                    >
                      {cancelText}
                    </Button>
                  )}
                  <Button
                    onClick={handleConfirm}
                    className={colors.button}
                  >
                    {confirmText}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

// Hook personalizado para usar el modal
import { useState } from "react"

export function useModal() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info" as "error" | "success" | "warning" | "info",
    confirmText: "Aceptar",
    cancelText: "Cancelar",
    showCancel: false,
    onConfirm: undefined as (() => void) | undefined,
    onCancel: undefined as (() => void) | undefined
  })

  const showModal = (options: Partial<typeof modalState>) => {
    setModalState(prev => ({ ...prev, ...options, isOpen: true }))
  }

  const hideModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const showError = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: "error",
      title,
      message,
      onConfirm,
      showCancel: false
    })
  }

  const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: "success",
      title,
      message,
      onConfirm,
      showCancel: false
    })
  }

  const showWarning = (title: string, message: string, onConfirm?: () => void) => {
    showModal({
      type: "warning",
      title,
      message,
      onConfirm,
      showCancel: false
    })
  }

  const showConfirmation = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void
  ) => {
    showModal({
      type: "warning",
      title,
      message,
      onConfirm,
      onCancel,
      showCancel: true,
      confirmText: "Confirmar",
      cancelText: "Cancelar"
    })
  }

  return {
    modalState,
    showModal,
    hideModal,
    showError,
    showSuccess,
    showWarning,
    showConfirmation,
    Modal: () => (
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    )
  }
}
