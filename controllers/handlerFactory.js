const AppError = require('./../utils/appError')
const APIFeatures = require('./../utils/apiFeatures')

exports.getAll = (Model, popOptions) => async (req, res) => {
  let filter = {}
  if (req.params.tourId) filter = { tour: req.params.tourId }

  const features = new APIFeatures(Model.find(filter), req.query)
    .filter().sort().limitFields().paginate()

  if (popOptions) {
    features.query = features.query.populate(popOptions)
  }

  const docs = await features.query

  res.send(docs)
}

exports.getOne = (Model, popOptions) => async (req, res) => {
  let query = Model.findById(req.params.id)
  if (popOptions) query = query.populate(popOptions)
  const doc = await query

  if (!doc) {
    throw new AppError('No document found with that ID', 404)
  }

  res.send(doc)
}

exports.createOne = Model => async (req, res) => {
  const doc = await Model.create(req.body)
  res.status(201).send(doc)
}

exports.updateOne = Model => async (req, res) => {
  const doc = await Model.findByIdAndUpdate(
    req.params.id, req.body, { new: true, runValidators: true }
  )

  if (!doc) {
    throw new AppError('No document found with that ID', 404)
  }

  res.send(doc)
}

exports.deleteOne = Model => async (req, res) => {
  const doc = await Model.findByIdAndDelete(req.params.id)

  if (!doc) {
    throw new AppError('No document found with that ID', 404)
  }

  res.status(204).send()
}
